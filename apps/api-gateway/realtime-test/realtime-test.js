(function () {
  const $ = (id) => document.getElementById(id);
  const logEl = $('log');
  let socket;
  let sseAbortController;

  const wsEvents = [
    'chat.session.created',
    'chat.session.updated',
    'chat.session.deleted',
    'chat.message.created',
    'chat.message.deleted',
    'exam.created',
    'exam.updated',
    'exam.deleted',
    'exam.published',
    'exam.closed',
    'question.created',
    'question.updated',
    'question.deleted',
    'question.reordered',
    'submission.started',
    'submission.answers.autosaved',
    'submission.submitted',
    'result.graded',
    'ai.chat.started',
    'ai.chat.token',
    'ai.chat.completed',
    'ai.chat.failed',
    'ai.material.ingest.started',
    'ai.material.ingest.progress',
    'ai.material.ingest.completed',
    'ai.material.ingest.failed',
    'ai.assessment.grading.started',
    'ai.assessment.grading.completed',
    'ai.assessment.grading.failed',
  ];

  function apiBase() {
    const value = $('apiBase').value.trim();
    return (value || window.location.origin).replace(/\/$/, '');
  }

  function token() {
    return $('token').value.trim();
  }

  function log(channel, event, payload) {
    const line = {
      at: new Date().toISOString(),
      channel,
      event,
      payload,
    };
    logEl.textContent += `${JSON.stringify(line, null, 2)}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function parseJson(id) {
    const value = $(id).value.trim();
    return value ? JSON.parse(value) : {};
  }

  function requireValue(id, label) {
    const value = $(id).value.trim();
    if (!value) {
      throw new Error(`${label} is required`);
    }
    return value;
  }

  function setValue(id, value) {
    if (value) {
      $(id).value = value;
    }
  }

  function runAction(name, action) {
    Promise.resolve()
      .then(action)
      .catch((error) => {
        log('error', name, {
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }

  async function request(path, options = {}) {
    const url = `${apiBase()}${path}`;
    try {
      log('http.request', `${options.method || 'GET'} ${path}`, {
        url,
        pageOrigin: window.location.origin,
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token()}`,
          ...(options.headers || {}),
        },
      });

      const text = await response.text();
      const body = parseResponseBody(text);
      log('http', `${options.method || 'GET'} ${path}`, body);

      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText}: ${formatBody(body)}`,
        );
      }

      return body;
    } catch (error) {
      log('http.error', `${options.method || 'GET'} ${path}`, {
        url,
        pageOrigin: window.location.origin,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  function parseResponseBody(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function formatBody(body) {
    if (body === null || body === undefined) return '';
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  $('wsConnect').addEventListener('click', () => {
    if (socket?.connected) return;
    const jwt = token();
    if (!jwt) {
      log('websocket.error', 'connect', {
        message: 'Paste a Clerk JWT before connecting WebSocket',
      });
      return;
    }

    log('websocket.request', 'connect', {
      url: `${apiBase()}/realtime`,
      pageOrigin: window.location.origin,
      hasToken: true,
    });

    socket = io(`${apiBase()}/realtime`, {
      auth: { token: jwt },
      query: { token: jwt },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      $('wsStatus').textContent = `WebSocket connected: ${socket.id}`;
      log('websocket', 'connect', { socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      $('wsStatus').textContent = 'WebSocket disconnected';
      log('websocket', 'disconnect', { reason });
    });

    socket.on('connect_error', (error) => {
      $('wsStatus').textContent = 'WebSocket connection failed';
      log('websocket', 'connect_error', { message: error.message });
    });

    socket.on('realtime.connected', (payload) => {
      log('websocket', 'realtime.connected', payload);
    });

    for (const event of wsEvents) {
      socket.on(event, (payload) => log('websocket', event, payload));
    }
  });

  $('wsDisconnect').addEventListener('click', () => {
    socket?.disconnect();
  });

  document.querySelectorAll('[data-subscribe]').forEach((button) => {
    button.addEventListener('click', () => {
      const event = button.dataset.subscribe;
      const field = button.dataset.field;
      const id = $(field).value.trim();
      const payload = {};

      if (field === 'chatSessionId' || field === 'aiChatSessionId') payload.sessionId = id;
      if (field === 'classId') payload.classId = id;
      if (field === 'examId') payload.examId = id;
      if (field === 'submissionId') payload.submissionId = id;
      if (field === 'aiJobId') payload.jobId = id;

      if (!socket?.connected) {
        log('websocket.error', event, { message: 'WebSocket is not connected' });
        return;
      }

      socket.emit(event, payload, (ack) => log('websocket', event, ack));
      log('websocket', event, payload);
    });
  });

  $('sseConnect').addEventListener('click', async () => {
    if (sseAbortController) return;
    sseAbortController = new AbortController();
    $('sseStatus').textContent = 'SSE connecting';

    try {
      const response = await fetch(`${apiBase()}/api/notifications/stream`, {
        headers: { authorization: `Bearer ${token()}` },
        signal: sseAbortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      $('sseStatus').textContent = 'SSE connected';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';
        for (const rawEvent of events) {
          const lines = rawEvent.split(/\r?\n/);
          const type = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
          const data = lines
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n');
          log('sse', type || 'message', data ? JSON.parse(data) : null);
        }
      }
    } catch (error) {
      if (!sseAbortController?.signal.aborted) {
        log('sse', 'error', { message: error.message });
      }
    } finally {
      sseAbortController = undefined;
      $('sseStatus').textContent = 'SSE disconnected';
    }
  });

  $('sseDisconnect').addEventListener('click', () => {
    sseAbortController?.abort();
    sseAbortController = undefined;
  });

  $('createSession').addEventListener('click', () =>
    runAction('createSession', async () => {
      const response = await request('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify(parseJson('chatSessionBody')),
      });
      const session = response?.data ?? response;
      setValue('chatSessionId', session?.id);
      log('client', 'chat.session.selected', { sessionId: session?.id });
    }),
  );

  $('createMessage').addEventListener('click', () =>
    runAction('createMessage', () =>
      request(`/api/chat/sessions/${requireValue('chatSessionId', 'Chat session ID')}/messages`, {
        method: 'POST',
        body: JSON.stringify(parseJson('chatMessageBody')),
      }),
    ),
  );

  $('publishExam').addEventListener('click', () =>
    runAction('publishExam', () =>
      request(`/api/assessments/exams/${requireValue('examId', 'Exam ID')}/publish`, {
        method: 'POST',
      }),
    ),
  );

  $('closeExam').addEventListener('click', () =>
    runAction('closeExam', () =>
      request(`/api/assessments/exams/${requireValue('examId', 'Exam ID')}/close`, {
        method: 'POST',
      }),
    ),
  );

  $('autosaveSubmission').addEventListener('click', () =>
    runAction('autosaveSubmission', () =>
      request(`/api/assessments/submissions/${requireValue('submissionId', 'Submission ID')}/answers`, {
        method: 'PATCH',
        body: JSON.stringify(parseJson('autosaveBody')),
      }),
    ),
  );

  $('submitSubmission').addEventListener('click', () =>
    runAction('submitSubmission', () =>
      request(`/api/assessments/submissions/${requireValue('submissionId', 'Submission ID')}/submit`, {
        method: 'POST',
      }),
    ),
  );

  $('createNotification').addEventListener('click', () =>
    runAction('createNotification', () =>
      request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(parseJson('notificationBody')),
      }),
    ),
  );

  $('markNotificationRead').addEventListener('click', () =>
    runAction('markNotificationRead', () =>
      request(`/api/notifications/${requireValue('notificationId', 'Notification ID')}/read`, {
        method: 'PATCH',
      }),
    ),
  );

  $('markAllRead').addEventListener('click', () =>
    runAction('markAllRead', () =>
      request('/api/notifications/read-all', {
        method: 'PATCH',
      }),
    ),
  );

  $('clearLog').addEventListener('click', () => {
    logEl.textContent = '';
  });
})();

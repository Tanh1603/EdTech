import axios from 'axios';

const apiBaseUrl = env('API_BASE_URL', 'http://localhost:8080/api');
const clerkSecretKey = env('CLERK_SECRET_KEY');
const teacherUserId = env('TEACHER1_ID');
const studentUserId = env('USER1_ID');
const otherStudentUserId = env('USER2_ID', studentUserId);
const flow = env('FLOW', 'all');

const state = {
  courseId: undefined,
  classroomId: env('E2E_CLASS_ID', ''),
  inviteCode: undefined,
  lessonId: env('E2E_LESSON_ID', ''),
  enrollmentId: undefined,
  materialId: undefined,
  roadmapId: undefined,
  roadmapItemId: undefined,
  examId: env('E2E_EXAM_ID', ''),
  questionId: undefined,
  submissionId: undefined,
  sessionId: undefined,
  messageId: undefined,
  notificationId: undefined,
  jobId: undefined,
};

const runId = Date.now();
const teacherToken = await getClerkJwt(teacherUserId);
const studentToken = await getClerkJwt(studentUserId);
const otherStudentToken =
  otherStudentUserId === studentUserId ? studentToken : await getClerkJwt(otherStudentUserId);

const teacher = client(teacherToken);
const student = client(studentToken);
const otherStudent = client(otherStudentToken);

await runSelected(flow);

async function runSelected(selectedFlow) {
  const flows = {
    smoke: runSmoke,
    academic: runAcademic,
    learning: runLearning,
    assessment: runAssessment,
    chat: runChat,
    notifications: runNotificationsJobsUsers,
  };

  if (selectedFlow === 'all') {
    for (const fn of Object.values(flows)) {
      await fn();
    }
    return;
  }

  const fn = flows[selectedFlow];

  if (!fn) {
    throw new Error(`Unknown FLOW=${selectedFlow}`);
  }

  await fn();
}

async function runSmoke() {
  log('Smoke');
  await expectStatus(axios.get(`${apiBaseUrl}/docs`), 200, 'GET /docs');
  await expectStatus(teacher.get('/courses', { params: { page: 1, limit: 5 } }), 200, 'GET /courses');
}

async function runAcademic() {
  log('Academic');
  const course = await data(
    teacher.post('/courses', {
      teacherId: teacherUserId,
      name: `Math E2E ${runId}`,
      description: 'Axios real flow course',
      thumbnailUrl: 'https://cdn.example.com/math.png',
    }),
    'POST /courses',
  );
  state.courseId = course.id;

  const classroom = await data(
    teacher.post('/classes', {
      courseId: state.courseId,
      name: `Math Class E2E ${runId}`,
      startAt: '2026-06-01T00:00:00.000Z',
      endAt: '2027-01-01T00:00:00.000Z',
    }),
    'POST /classes',
  );
  state.classroomId = classroom.id;
  state.inviteCode = classroom.inviteCode;

  const lesson = await data(
    teacher.post('/lessons', {
      courseId: state.courseId,
      title: `Derivatives E2E ${runId}`,
      description: 'Intro to derivatives',
      orderNo: 1,
    }),
    'POST /lessons',
  );
  state.lessonId = lesson.id;

  await data(
    teacher.post(`/classes/${state.classroomId}/lessons`, {
      lessonId: state.lessonId,
      isPublished: true,
    }),
    'POST /classes/:id/lessons',
  );

  const enrollment = await data(
    student.post('/enrollments/join', { inviteCode: state.inviteCode }),
    'POST /enrollments/join',
  );
  state.enrollmentId = enrollment.id;

  await data(
    student.get(`/classes/${state.classroomId}/lessons`, {
      params: { publishedOnly: true },
    }),
    'GET /classes/:id/lessons',
  );
}

async function runLearning() {
  log('Learning');

  if (!state.lessonId) {
    requireEnv('E2E_LESSON_ID', 'Learning flow needs a lessonId. Run academic first or set E2E_LESSON_ID.');
  }

  const material = await data(
    teacher.post('/learning/materials', {
      lessonId: state.lessonId,
      title: `Material E2E ${runId}`,
      storageUrl: 'https://cdn.example.com/e2e/material.pdf',
      publicId: `e2e/material-${runId}`,
      mimeType: 'application/pdf',
      size: 1024,
    }),
    'POST /learning/materials',
  );
  state.materialId = material.id;

  const roadmap = await data(
    student.post('/learning/roadmaps', {
      title: `Roadmap E2E ${runId}`,
      targetGoal: 'Improve calculus mastery',
    }),
    'POST /learning/roadmaps',
  );
  state.roadmapId = roadmap.id;

  const item = await data(
    student.post(`/learning/roadmaps/${state.roadmapId}/items`, {
      title: 'Review derivatives',
      topic: 'Derivative',
      orderNo: 1,
    }),
    'POST /learning/roadmaps/:id/items',
  );
  state.roadmapItemId = item.id;

  await data(student.post(`/learning/roadmaps/items/${state.roadmapItemId}/complete`), 'POST complete item');
  await data(student.get(`/learning/roadmaps/${state.roadmapId}/progress`), 'GET roadmap progress');
}

async function runAssessment() {
  log('Assessment');

  if (!state.classroomId) {
    requireEnv('E2E_CLASS_ID', 'Assessment flow needs a classroomId. Run academic first or set E2E_CLASS_ID.');
  }

  const exam = await data(
    teacher.post('/assessments/exams', {
      classId: state.classroomId,
      title: `Exam E2E ${runId}`,
      description: 'Axios real flow exam',
      duration: 30,
    }),
    'POST /assessments/exams',
  );
  state.examId = exam.id;

  const question = await data(
    teacher.post(`/assessments/exams/${state.examId}/questions`, {
      type: 'single_choice',
      prompt: 'What is derivative of x^2?',
      options: ['2x', 'x', 'x^2'],
      answerKey: { correctOption: 0 },
      points: 1,
      orderNo: 1,
    }),
    'POST question',
  );
  state.questionId = question.id;

  await data(teacher.post(`/assessments/exams/${state.examId}/publish`), 'POST publish exam');

  const submission = await data(student.post(`/assessments/exams/${state.examId}/start`), 'POST start exam');
  state.submissionId = submission.submissionId ?? submission.id;

  await data(
    student.patch(`/assessments/submissions/${state.submissionId}/answers`, {
      answers: [{ questionId: state.questionId, answer: '2x' }],
    }),
    'PATCH answers',
  );
  await data(student.post(`/assessments/submissions/${state.submissionId}/submit`), 'POST submit');
  await data(
    teacher.post(`/assessments/results/${state.submissionId}/manual-grade`, {
      score: 1,
      feedback: { comment: 'Correct' },
    }),
    'POST manual grade',
  );
}

async function runChat() {
  log('Chat');
  const session = await data(
    student.post('/chat/sessions', {
      classId: state.classroomId || undefined,
      title: `Chat E2E ${runId}`,
    }),
    'POST /chat/sessions',
  );
  state.sessionId = session.id;

  const message = await data(
    student.post(`/chat/sessions/${state.sessionId}/messages`, {
      content: 'Explain derivatives in simple words',
    }),
    'POST chat message',
  );
  state.messageId = message.userMessage?.id ?? message.id;

  await data(student.get(`/chat/sessions/${state.sessionId}/messages`), 'GET chat messages');

  const forbidden = await otherStudent.get(`/chat/sessions/${state.sessionId}`, {
    validateStatus: () => true,
  });
  if (![403, 404].includes(forbidden.status)) {
    throw new Error(`Expected other student to get 403/404, got ${forbidden.status}`);
  }
}

async function runNotificationsJobsUsers() {
  log('Notifications / Jobs / Users');
  const notification = await data(
    teacher.post('/notifications', {
      title: `Reminder E2E ${runId}`,
      body: 'Assessment starts soon',
      audience: {
        type: 'users',
        values: [studentUserId],
      },
      resourceType: state.examId ? 'exam' : undefined,
      resourceId: state.examId || undefined,
    }),
    'POST /notifications',
  );
  state.notificationId = notification.id;
  state.jobId = notification.jobId;

  await data(student.get('/notifications/unread-count'), 'GET unread count');
  await data(student.get('/notifications', { params: { page: 1, limit: 20 } }), 'GET notifications');

  if (state.notificationId) {
    await data(student.patch(`/notifications/${state.notificationId}/read`), 'PATCH notification read');
  }

  await data(student.patch('/notifications/read-all'), 'PATCH read all');

  if (state.jobId) {
    await data(teacher.get(`/jobs/${state.jobId}`), 'GET job');
  }

  await data(teacher.get('/users', { params: { page: 1, limit: 20 } }), 'GET users');
}

async function getClerkJwt(userId) {
  const sessionResponse = await axios.post(
    'https://api.clerk.com/v1/sessions',
    { user_id: userId },
    {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const sessionId = sessionResponse.data.id;
  const tokenResponse = await axios.post(
    `https://api.clerk.com/v1/sessions/${sessionId}/tokens`,
    { expires_in_seconds: 604800 },
    {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!tokenResponse.data.jwt) {
    throw new Error(`Clerk returned no jwt for ${userId}`);
  }

  return tokenResponse.data.jwt;
}

function client(token) {
  return axios.create({
    baseURL: apiBaseUrl,
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });
}

async function data(request, label) {
  const response = await request;

  if (response.status < 200 || response.status >= 300 || response.data?.success === false) {
    throw new Error(`${label} failed: ${response.status} ${JSON.stringify(response.data)}`);
  }

  console.log(`OK ${label}`);
  return response.data?.data ?? response.data;
}

async function expectStatus(request, status, label) {
  const response = await request;

  if (response.status !== status) {
    throw new Error(`${label} expected ${status}, got ${response.status}`);
  }

  console.log(`OK ${label}`);
}

function env(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === '') {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function requireEnv(name, message) {
  if (!process.env[name]) {
    throw new Error(message);
  }
}

function log(name) {
  console.log(`\n=== ${name} ===`);
}


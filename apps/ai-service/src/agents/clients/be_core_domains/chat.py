from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext, to_struct


class ChatClientMixin:
    def append_assistant_message(
        self,
        session_id: str,
        content: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._messages_pb2.MessageCreateRequest(
            session_id=session_id,
            body=to_struct({"role": "assistant", "content": content}),
        )
        return self._call_object(self.chat_messages.CreateMessage, request, context, True)

    def get_messages(
        self,
        session_id: str,
        context: BeCoreCallContext,
        page: int = 1,
        limit: int = 50,
        before: str | None = None,
    ) -> dict[str, Any]:
        request = self._messages_pb2.MessagesQuery(
            session_id=session_id,
            page=page,
            limit=limit,
            before=before or "",
        )
        return self._call_page(self.chat_messages.GetMessages, request, context, True)

    def get_message_detail(
        self,
        message_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._messages_pb2.MessageIdRequest(message_id=message_id)
        return self._call_object(self.chat_messages.GetMessageDetail, request, context, True)

    def get_classroom_analytics(
        self,
        class_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._analytics_pb2.ClassIdRequest(class_id=class_id)
        return self._call_object(
            self.chat_analytics.GetClassroomAnalytics,
            request,
            context,
            True,
        )

    def update_session(
        self,
        session_id: str,
        body: dict[str, Any],
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._sessions_pb2.SessionUpdateRequest(
            session_id=session_id,
            body=to_struct(body),
        )
        return self._call_object(self.chat_sessions.UpdateSession, request, context, True)

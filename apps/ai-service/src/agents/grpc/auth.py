from __future__ import annotations

from collections.abc import Callable
from typing import Any

import grpc

from config.settings import Settings


class ServiceTokenInterceptor(grpc.ServerInterceptor):
    def __init__(self, settings: Settings) -> None:
        self.expected_token = settings.service_token

    def intercept_service(
        self,
        continuation: Callable[[grpc.HandlerCallDetails], grpc.RpcMethodHandler | None],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler | None:
        handler = continuation(handler_call_details)
        if handler is None:
            return None

        if handler.unary_unary:
            return grpc.unary_unary_rpc_method_handler(
                self._wrap_unary_unary(handler.unary_unary),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        if handler.unary_stream:
            return grpc.unary_stream_rpc_method_handler(
                self._wrap_unary_stream(handler.unary_stream),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        if handler.stream_unary:
            return grpc.stream_unary_rpc_method_handler(
                self._wrap_stream_unary(handler.stream_unary),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        if handler.stream_stream:
            return grpc.stream_stream_rpc_method_handler(
                self._wrap_stream_stream(handler.stream_stream),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        return handler

    def _wrap_unary_unary(self, handler: Callable[..., Any]) -> Callable[..., Any]:
        def wrapped(request: Any, context: grpc.ServicerContext) -> Any:
            self._assert_service_token(context)
            return handler(request, context)

        return wrapped

    def _wrap_unary_stream(self, handler: Callable[..., Any]) -> Callable[..., Any]:
        def wrapped(request: Any, context: grpc.ServicerContext) -> Any:
            self._assert_service_token(context)
            yield from handler(request, context)

        return wrapped

    def _wrap_stream_unary(self, handler: Callable[..., Any]) -> Callable[..., Any]:
        def wrapped(request_iterator: Any, context: grpc.ServicerContext) -> Any:
            self._assert_service_token(context)
            return handler(request_iterator, context)

        return wrapped

    def _wrap_stream_stream(self, handler: Callable[..., Any]) -> Callable[..., Any]:
        def wrapped(request_iterator: Any, context: grpc.ServicerContext) -> Any:
            self._assert_service_token(context)
            yield from handler(request_iterator, context)

        return wrapped

    def _assert_service_token(self, context: grpc.ServicerContext) -> None:
        metadata = {
            item.key.lower(): (
                item.value.decode("utf-8") if isinstance(item.value, bytes) else item.value
            )
            for item in context.invocation_metadata()
        }
        if metadata.get("x-service-token") != self.expected_token:
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid service token")

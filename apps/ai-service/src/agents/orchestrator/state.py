from typing import Any, Literal, TypedDict

AgentProfile = Literal["tutor", "learning_path", "assessment_material"]
RuntimeAction = Literal[
    "chat",
    "stream_chat",
    "grade_submission",
    "generate_roadmap",
    "ingest_material",
]


class ToolCall(TypedDict):
    name: str
    payload: dict[str, Any]


class RuntimeState(TypedDict, total=False):
    action: RuntimeAction
    profile: AgentProfile
    session_id: str
    message_id: str
    user_id: str
    class_id: str
    course_id: str
    resource_id: str
    job_id: str
    prompt: str
    use_rag: bool
    top_k: int
    options: dict[str, Any]
    payload: dict[str, Any]
    request_context: Any
    tool_context: Any
    plan: list[str]
    reasoning: dict[str, Any]
    tool_calls: list[ToolCall]
    tool_results: dict[str, Any]
    current_message: str
    clean_history: str
    learning_context: dict[str, Any]
    intent: str
    standalone_question: str
    retrieval_mode: str
    retrieved_context: str
    rag_scores: list[float]
    response_warnings: list[str]
    memory_context: dict[str, Any]
    business_policy: str
    prompt_text: str
    retrieval_results: list[Any]
    citations: list[dict[str, Any]]
    content: str
    assistant_message_id: str
    usage: dict[str, Any]
    metadata: dict[str, Any]
    error: dict[str, Any]

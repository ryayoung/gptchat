from typing import Iterable
import json
from json import JSONDecodeError
from openai.types.chat import chat_completion as completion
from openai.types.chat import chat_completion_chunk as completion_chunk
from openai.types.chat.chat_completion_message import ChatCompletionMessage, FunctionCall
from openai.types.chat.chat_completion_message_tool_call import Function, ChatCompletionMessageToolCall


def parse_incomplete_json(string: str) -> dict:
    """
    Given a potentially incomplete json string that could terminate at any character,
    return a dict that includes all fully-complete key/value pairs from the string.

    Assumes that only the last key/value pair in the string may be incomplete.
    """
    try:
        return json.loads(string)
    except JSONDecodeError:
        idx = len(string)

    while idx > 0:
        idx = string.rfind(",", 0, idx)

        if idx == -1:
            try:
                return json.loads(string + "}")
            except JSONDecodeError:
                return {}

        try:
            return json.loads(string[:idx] + "}")
        except JSONDecodeError:
            continue

    return {}


def concat_stream(
    streamed_choices: Iterable[completion_chunk.Choice]
) -> completion.Choice:
    """
    Combines the accumulated choices from an openai streamed chat completion
    into a single response Choice.

    Takes an iterable of completion chunk Choice objects from a stream. They must be in order.
    """

    def handle_content(content: str, msg: ChatCompletionMessage):
        if msg.content is None:
            msg.content = content
        else:
            msg.content += content

    def handle_function_call(
        function_call: completion_chunk.ChoiceDeltaFunctionCall,
        msg: ChatCompletionMessage,
    ):
        if msg.function_call is None:
            msg.function_call =  FunctionCall(
                name=function_call.name or "",
                arguments=function_call.arguments or "",
            )
        else:
            msg.function_call.arguments += function_call.arguments or ""

    def handle_tool_calls(
        tool_calls: list[completion_chunk.ChoiceDeltaToolCall],
        msg: ChatCompletionMessage,
    ):
        if msg.tool_calls is None:
            msg.tool_calls = []

        call = tool_calls[0] 
        is_new_tool_call = call.index >= len(msg.tool_calls)

        if is_new_tool_call:
            if call.id is not None and call.function is not None:
                msg.tool_calls.append(
                    ChatCompletionMessageToolCall(
                        id=call.id,
                        type="function",
                        function=Function(
                            name=call.function.name or "",
                            arguments=call.function.arguments or "",
                        )
                    )
                )
        else:
            if call.function is not None and call.function.arguments is not None:
                msg.tool_calls[call.index].function.arguments += call.function.arguments

    msg = ChatCompletionMessage(role="assistant", content=None)
    finish_reason = "stop"

    for chunk in streamed_choices:

        if chunk.finish_reason is not None:
            finish_reason = chunk.finish_reason

        if chunk.delta.content is not None:
            handle_content(chunk.delta.content, msg)

        if chunk.delta.function_call is not None:
            handle_function_call(chunk.delta.function_call, msg)
        elif chunk.delta.tool_calls is not None:
            handle_tool_calls(chunk.delta.tool_calls, msg)

    return completion.Choice(
        index=0,
        message=msg,
        finish_reason=finish_reason,
    )

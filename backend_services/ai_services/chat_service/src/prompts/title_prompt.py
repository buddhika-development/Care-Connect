from langchain_core.prompts import ChatPromptTemplate

title_prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a helpful assistant that generates short, descriptive chat session titles.

Rules:
- Generate a title that summarises the user's message in 3–6 words.
- The title should be in Title Case.
- Do NOT add quotes, punctuation, or any prefix/suffix — output the title text only.
- Keep it natural and relevant to the healthcare context.""",
        ),
        (
            "human",
            "Generate a concise session title for this message:\n\n{message}",
        ),
    ]
)

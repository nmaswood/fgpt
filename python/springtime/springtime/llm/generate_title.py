from pydantic import BaseModel
import openai


class GenerateTitleRequest(BaseModel):
    question: str
    answer: str


def generate_title_streaming(req: GenerateTitleRequest):
    prompt = create_prompt(req.question, req.answer)
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {'role': 'user', 'content': prompt}
        ],
        temperature=0,
        stream=True
    )
    for resp in response:
        choices = resp['choices']
        delta = choices[0].get('delta')
        if not delta:
            continue
        content = delta.get('content')
        if content:
            yield content


def create_prompt(question: str, answer: str):
    prompt = f"""

    You are a expert financial analyst chat bot.
    The user asked you the following question and you responded with the following answer.
    Based on the question and answer please respond with a concise, accurate title for the exchange.

    Question: {question}
    Answer: {answer}
    """.format(question=question, answer=answer)
    return prompt

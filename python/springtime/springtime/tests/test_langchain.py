from springtime.llm.ml import message_completions

DUMMY = """
What do you believe the edible and non-edible revenue mix would be in 2023 as we move throughout the year? Do you think that swings a little bit more back to the edible side of things? Niel Marotta Yes, probably. I mean, the mix shift is really the lozenges, right, the ingestible extracts, which -- although we may disagree, Health Canada deemed is noncompliant across the board, and it's not just in vivo with several companies, as you know, Andrew. So I would expect that percentage to climb higher again given that these products will be out of market beyond May 31. And we've already -- we stopped production several weeks ago of these products where we were ordered to. And we haven't sold anything in Q2 obviously
"""


def test_conversation_chain():
    res = message_completions(DUMMY)
    print(res)

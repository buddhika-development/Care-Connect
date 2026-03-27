from src.core.llm.mistral import mistral
from src.core.llm.llm_factory import LLM

llm = mistral.getChatInstance()

summery_llm = LLM(llm)
promt = "you need to act as the summery engin... text need to summerize : I am buddhika madusanaka, i am from sri lanka institute of sri lanka. I am working as AI engineer."

print(summery_llm.invoke(promt))
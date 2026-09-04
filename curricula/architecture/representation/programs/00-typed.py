"""النوعُ في القواعد أم في العُرف — والقارئان يردّان شيئين مختلفين."""
import json
import tomllib

print("tomllib:", repr(tomllib.loads("created = 1979-05-27")["created"]))
print("json:   ", repr(json.loads('{"created": "1979-05-27"}')["created"]))

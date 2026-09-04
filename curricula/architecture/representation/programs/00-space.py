"""ما أمكن تمثيلُه سيُمثَّل — والفجوة تتّسع مع كلّ صندوقٍ يُضاف."""
import itertools
import json

from epitome import render

print("صناديق   يقبله الشكل   يقبله المعنى   مستحيلٌ مقبول")
for n in range(2, 6):
    names = [chr(ord("a") + i) for i in range(n)]
    boxes = ",".join('{"name":"%s","label":"x"}' % x for x in names)
    form = meaning = 0
    for src, dst in itertools.product(names + ["?"], repeat=2):
        doc = '{"boxes":[%s],"links":[{"from":"%s.out","to":"%s.in"}]}' % (boxes, src, dst)
        json.loads(doc)
        form += 1
        try:
            render(doc)
            meaning += 1
        except KeyError:
            pass
    print(f"{n:^8}{form:^14}{meaning:^15}{form - meaning:^14}")

# Gera a "cola" (categoria + subcategoria por linha) a partir do seed de gastos.
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
txt = open(r'C:\Users\maria\Downloads\diagonal-claudecode\diagonal\src\gastosSeed.js', encoding='utf-8').read()
# [ 'mes', 'cat', 'nome', valor ]
rows = re.findall(r"\[\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*([0-9.]+)\s*\]", txt)
ORDER = ['Fixos','Mercado','Uber','Trabalho','Mãe','Saúde','Viagem','Coisas','Roupa','Skin care','Bobeira','Rolês','Presentes']
tot = {}
for mes, cat, nome, val in rows:
    nome = nome.replace("\\'", "'")
    tot.setdefault(cat, {})
    tot[cat][nome] = tot[cat].get(nome, 0) + float(val)
cats = ORDER + [c for c in tot if c not in ORDER]
for c in cats:
    if c not in tot:
        continue
    for nome, _ in sorted(tot[c].items(), key=lambda kv: -kv[1]):
        print(f'{c}\t{nome}')

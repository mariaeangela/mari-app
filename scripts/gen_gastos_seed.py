# Gera src/gastosSeed.js a partir de scripts/gastos_import.json
import json, io

SRC = r'C:\Users\maria\Downloads\diagonal-claudecode\diagonal\scripts\gastos_import.json'
OUT = r'C:\Users\maria\Downloads\diagonal-claudecode\diagonal\src\gastosSeed.js'

MES = {'jan26':'2026-01','Fev26':'2026-02','Mar26':'2026-03','Abr26':'2026-04',
       'Mai26':'2026-05','Jun26':'2026-06','Jul26':'2026-07'}
CAT = {'fixos':'Fixos','mercado':'Mercado','uber':'Uber','trabalho':'Trabalho',
       'mãe':'Mãe','saúde':'Saúde','viagem':'Viagem','coisas':'Coisas','roupa':'Roupa',
       'skin care':'Skin care','bobeira':'Bobeira','rolês':'Rolês','presentes':'Presentes'}

def cap(s):
    s = s.strip()
    return s[:1].upper() + s[1:] if s else s

def jsstr(s):
    return "'" + s.replace('\\','\\\\').replace("'","\\'") + "'"

d = json.load(open(SRC, encoding='utf-8'))
itens = []       # [mes, Categoria, Nome, valor]
totais = {}      # mes -> {Categoria: total}
warn = []
for mkey, cats in d.items():
    mes = MES[mkey]
    totais.setdefault(mes, {})
    for c in cats:
        cat = CAT.get(c['categoria'].strip().lower())
        if not cat:
            warn.append('categoria desconhecida: ' + c['categoria']); continue
        if c['total']:
            totais[mes][cat] = round(c['total'], 2)
        for nome, val in c['itens']:
            if nome == '(ajuste)': nome = 'Ajuste'
            elif nome == '(sem descrição)': nome = 'Sem descrição'
            elif nome.startswith('('):
                warn.append(f'{mes} {cat}: item genérico {nome} {val}')
            itens.append([mes, cat, cap(nome), round(val, 2)])

# ordem canônica de categorias
ORDER = ['Fixos','Mercado','Uber','Trabalho','Mãe','Saúde','Viagem','Coisas','Roupa','Skin care','Bobeira','Rolês','Presentes']

buf = io.StringIO()
buf.write('// GERADO por scripts/gen_gastos_seed.py a partir de D:\\vida financeira.xlsx\n')
buf.write('// Quebra itemizada dos Gastos 2026 (jan–jul), somando o total de cada categoria.\n')
buf.write('// [mes, categoria, nome, valor]. Não editar à mão — regerar pelo script.\n\n')

buf.write('export const GASTOS_ITENS_2026 = [\n')
# agrupa por mês para leitura
by_mes = {}
for row in itens:
    by_mes.setdefault(row[0], []).append(row)
for mes in sorted(by_mes):
    buf.write(f'  // {mes}\n')
    rows = sorted(by_mes[mes], key=lambda r: (ORDER.index(r[1]) if r[1] in ORDER else 99))
    for mes_, cat, nome, val in rows:
        buf.write(f'  [{jsstr(mes_)}, {jsstr(cat)}, {jsstr(nome)}, {val}],\n')
buf.write('];\n\n')

buf.write('export const GASTOS_TOTAIS_2026 = [\n')
for mes in sorted(totais):
    parts = []
    for cat in ORDER:
        if cat in totais[mes]:
            parts.append(f"{{ categoria: {jsstr(cat)}, valor: {totais[mes][cat]} }}")
    buf.write(f"  {{ mes: {jsstr(mes)}, itens: [{', '.join(parts)}] }},\n")
buf.write('];\n')

open(OUT, 'w', encoding='utf-8').write(buf.getvalue())
print('itens:', len(itens), '| meses:', len(totais))
for m in sorted(totais):
    tot = sum(totais[m].values())
    ni = sum(1 for r in itens if r[0]==m)
    print(f'  {m}: total R$ {tot:>10.2f} | {ni} itens')
if warn:
    print('\nAVISOS:')
    for w in warn[:30]: print(' -', w)
else:
    print('\nsem avisos (todos os itens têm nome real).')
print('\n->', OUT)

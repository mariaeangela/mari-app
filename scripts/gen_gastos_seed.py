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

# Consolidação de itens por categoria (regra da Mari): reduz nomes crus a poucos rótulos.
# Para cada categoria aqui, um item cujo nome contém um alias vira o rótulo; o resto vira 'default'.
# Ordem dos grupos importa (do mais específico pro mais geral).
CONSOLIDA = {
    'Mercado': {
        'default': 'Mercado',
        'grupos': {
            'Nutricar': ['nutricar'],
            'Cozinha de atleta': ['cozinha atleta', 'cozinha de atleta'],
            'Livup': ['livup', 'liv up'],
        },
    },
    # Uber: tudo vira "Uber vida", exceto o que a Mari marcar com "trabalho" (a partir de jul/2026).
    'Uber': {
        'default': 'Uber vida',
        'grupos': {
            'Uber trabalho': ['trabalho', 'trab'],
        },
    },
    # Trabalho: Almoço/Jantar/Outros. Ate jul/2026 tudo = Almoço; a divisao vale a partir de ago/2026
    # (quando a Mari comeca a marcar). 'desde' desliga os grupos nos meses anteriores.
    'Trabalho': {
        'default': 'Almoço',
        'desde': '2026-08',
        'grupos': {
            'Jantar': ['jantar'],
            'Outros': ['outro'],
        },
    },
    # Mãe: tudo numa categoria só.
    'Mãe': {
        'default': 'Mãe',
        'grupos': {},
    },
    # Saúde: baldes definidos pela Mari. default None = itens sem match ficam com o nome cru.
    'Saúde': {
        'default': None,
        'grupos': {
            'Farmácia/remédios': ['farmác', 'remédi', 'remedi', 'droga'],
            'Dentista': ['dentista', 'dente', 'escova'],
            'Psiquiatria': ['psiquiatr', 'terapia', 'taciana'],
            'Exames': ['exame', 'radiografia', 'teste'],
            'Consultas': ['consulta'],
            'Estética': ['podologia', 'estética', 'estetica', 'depila', 'manicure', 'sobrancelha'],
            'Academia': ['academia', 'velocity', 'gym', 'wellhub'],
        },
    },
}

def consolidate(cat, nome, mes=None):
    rule = CONSOLIDA.get(cat)
    if not rule:
        return nome
    low = nome.strip().lower()
    desde = rule.get('desde')
    if not (desde and mes and mes < desde):  # aplica os grupos, salvo antes do 'desde'
        for canonical, aliases in rule['grupos'].items():
            if any(a in low for a in aliases):
                return canonical
    return rule['default'] if rule.get('default') is not None else nome

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

# aplica consolidação e re-agrega por (mes, categoria, nome canônico)
_agg, _order = {}, []
for mes, cat, nome, val in itens:
    canon = consolidate(cat, nome, mes)
    key = (mes, cat, canon)
    if key not in _agg: _agg[key] = 0.0; _order.append(key)
    _agg[key] += val
itens = [[m, c, n, round(_agg[(m, c, n)], 2)] for (m, c, n) in _order]

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

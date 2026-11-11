#!/usr/bin/env python3
"""
Genera data.json para el Tablero de Internacionalización · UNIMINUTO Sede Tolima-Huila.

Uso:
  python3 build_data.py --convenios Consolidado_convenios_y_redes_internacionales_Activos_a_11.2026.xlsx \
                        --patrocinios CONSOLIDADO_PATROCINIOS_Y_DONACIONES.xlsx \
                        --movilidad Consolidado_Movilidad_2024-1.xlsx Consolidado_Movilidad_2024-2.xlsx ... \
                        --corte 2026-11-11

Reglas:
  * Solo datos agregados o institucionales: no se publican personas. Los donantes que son
    personas naturales se reemplazan por «Persona natural (donante N)».
  * No se publican los enlaces internos de SharePoint (columna UBICACIÓN).
  * Centros fuera del alcance de la sede (Florencia, Mocoa, Puerto Boyacá, etc.) se excluyen
    de todas las cifras por Centro Universitario.
"""
import argparse, datetime as dt, json, re, sys, unicodedata
import openpyxl

EXCLUIDOS = {'FLORENCIA', 'MOCOA', 'PUERTO BOYACA', 'CAJAMARCA', 'FRESNO', 'LIBANO', 'MARIQUITA'}
CU_CANON = {'IBAGUE': 'Ibagué', 'NEIVA': 'Neiva', 'GARZON': 'Garzón', 'PITALITO': 'Pitalito',
            'LERIDA': 'Lérida', 'LA DORADA': 'La Dorada', 'PLANADAS': 'Planadas'}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode()
    return re.sub(r'\s+', ' ', s).strip().upper()


def clean(s):
    if s is None:
        return None
    s = re.sub(r'\s+', ' ', str(s)).strip()
    return s or None


def cu_name(raw):
    n = norm(raw).replace('COA ', '').replace('CU ', '').strip()
    if n in EXCLUIDOS:
        return None
    return CU_CANON.get(n)


# ------------------------------------------------------------------ CONVENIOS
CONTINENTE = {
    'Argentina': 'América del Sur', 'Bolivia': 'América del Sur', 'Brasil': 'América del Sur', 'Chile': 'América del Sur',
    'Colombia': 'América del Sur', 'Ecuador': 'América del Sur', 'Paraguay': 'América del Sur', 'Perú': 'América del Sur',
    'Uruguay': 'América del Sur', 'Venezuela': 'América del Sur',
    'México': 'Norte y Centroamérica', 'Estados Unidos de América': 'Norte y Centroamérica', 'Canadá': 'Norte y Centroamérica',
    'Costa Rica': 'Norte y Centroamérica', 'El Salvador': 'Norte y Centroamérica', 'Guatemala': 'Norte y Centroamérica',
    'Honduras': 'Norte y Centroamérica', 'Nicaragua': 'Norte y Centroamérica', 'Panamá': 'Norte y Centroamérica',
    'Cuba': 'Caribe', 'República Dominicana': 'Caribe', 'Puerto Rico': 'Caribe',
    'España': 'Europa', 'Francia': 'Europa', 'Italia': 'Europa', 'Portugal': 'Europa', 'Finlandia': 'Europa',
    'Eslovaquia': 'Europa', 'Alemania': 'Europa', 'Bulgaria': 'Europa', 'República Checa': 'Europa', 'Reino Unido': 'Europa',
    'Bélgica': 'Europa', 'Países Bajos': 'Europa', 'Polonia': 'Europa', 'Suiza': 'Europa',
    'Turquía': 'Asia y Oceanía', 'Corea del Sur': 'Asia y Oceanía', 'Emiratos Árabes Unidos': 'Asia y Oceanía',
    'China': 'Asia y Oceanía', 'Japón': 'Asia y Oceanía', 'India': 'Asia y Oceanía', 'Australia': 'Asia y Oceanía',
    'Sudáfrica': 'África', 'Mali': 'África', 'Costa De Marfil': 'África', 'Marruecos': 'África',
}


def header_rows(ws):
    rows = list(ws.iter_rows(values_only=True))
    hdr = [norm(h) for h in rows[0]]
    return hdr, rows[1:]


def col(hdr, *names):
    for n in names:
        if norm(n) in hdr:
            return hdr.index(norm(n))
    return None


def fecha(v):
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime('%Y-%m-%d')
    return None


def tipo_conv(v):
    v = clean(v) or 'Sin dato'
    v = v.strip()
    if v.lower().startswith('memorando'):
        return 'Memorando de entendimiento'
    if v.upper() in ('NA', 'N/A'):
        return 'Sin dato'
    return v[0].upper() + v[1:]


def aplicabilidad(rect, solicito):
    r, s = norm(rect), norm(solicito)
    if 'TOLIMA' in r or 'TOLIMA' in s:
        return 'Sede Tolima-Huila'
    if r == 'TODAS LAS RECTORIAS':
        return 'Todas las rectorías'
    if not r:
        return 'Sin especificar'
    return 'Otra rectoría'


def si_no(v):
    n = norm(v)
    if n in ('SI', 'SÍ'):
        return 'Sí'
    if n == 'NO':
        return 'No'
    if 'VALIDAR' in n:
        return 'Validar con el aliado'
    return 'Sin dato'


def parse_vigentes(ws, ambito):
    hdr, rows = header_rows(ws)
    c = {k: col(hdr, *v) for k, v in {
        'pais': ['PAÍS'], 'ciudad': ['CIUDAD'], 'inst': ['INSTITUCIÓN'], 'car': ['CARÁCTER'], 'tipo': ['TIPO DE CONVENIO'],
        'alc': ['ALCANCE DEL CONVENIO'], 'sus': ['FECHA DE SUSCRIPCIÓN'], 'dur': ['DURACIÓN'], 'ven': ['FECHA DE VENCIMIENTO'],
        'sol': ['QUIEN SOLICITÓ EL CONVENIO', 'QUIÉN SOLICITÓ EL CONVENIO'], 'rec': ['RECTORÍAS EN LAS QUE APLICA'],
        'act': ['ACTIVO O INACTIVO'], 'larga': ['¿APLICA PARA INTERCAMBIOS LARGA ESTANCIA PARA POSGRADOS?'],
        'web': ['PÁGINA WEB'], 'acred': ['IES ACREDITADA'], 'info': ['INFORMACIÓN ADICIONAL']}.items()}
    out = []
    for r in rows:
        g = lambda k: r[c[k]] if c[k] is not None and c[k] < len(r) else None
        inst = clean(g('inst'))
        if not inst:
            continue
        ven_raw = g('ven')
        alc = [a.strip() for a in str(g('alc') or '').split(',') if a.strip()]
        web = clean(g('web'))
        if web and (web.upper() in ('N/A', 'NA') or 'sharepoint' in web.lower()):
            web = None
        act = clean(g('act'))
        pais = clean(g('pais')) or 'Sin dato'
        out.append({
            'ambito': ambito, 'pais': pais, 'continente': CONTINENTE.get(pais, 'Otro'),
            'ciudad': clean(g('ciudad')), 'institucion': inst, 'caracter': clean(g('car')) or 'Sin dato',
            'tipo': tipo_conv(g('tipo')), 'alcance': alc, 'suscripcion': fecha(g('sus')),
            'duracion': clean(g('dur')), 'vencimiento': fecha(ven_raw),
            'vencimiento_txt': None if fecha(ven_raw) else (clean(ven_raw) or 'Sin dato'),
            'solicito': clean(g('sol')) or 'Sin dato', 'rectorias': clean(g('rec')) or 'Sin especificar',
            'aplica': aplicabilidad(g('rec'), g('sol')),
            'activo': act if act in ('Activo', 'Inactivo') else 'Sin dato',
            'larga_estancia': si_no(g('larga')), 'web': web,
            'acreditada': si_no(g('acred')) if c['acred'] is not None else None,
        })
    return out


def motivo(v):
    n = norm(v)
    if not n:
        return 'Sin registro'
    if 'NO HUBO RESPUESTA' in n or 'NO RESPONDIO' in n:
        return 'Sin respuesta del aliado'
    if n.startswith('PREGUNTAR') or 'CONSULTAR' in n:
        return 'Por consultar con la rectoría'
    if 'RED' in n and 'HACE PARTE' in n:
        return 'UNIMINUTO salió de la red'
    if 'ESPECIFICO' in n and 'PROGRAMA' in n:
        return 'Era para un programa específico'
    if 'INACTIVO' in n:
        return 'Convenio inactivo'
    if any(k in n for k in ('NO SERA RENOVADO', 'NO RENOV', 'NO SE RENUEVA', 'NO ESTA INTERESADO', 'DECIDE NO', 'NO RENOVARLO')):
        return 'Decisión de no renovar'
    return 'Renovación o verificación pendiente'


def parse_convenios(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    vig = parse_vigentes(wb['INTERNACIONALES'], 'Internacional') + parse_vigentes(wb['NACIONALES'], 'Nacional')

    # En proceso
    hdr, rows = header_rows(wb['EN PROCESO'])
    proc = []
    for r in rows:
        inst = clean(r[col(hdr, 'INSTITUCIÓN')])
        if not inst:
            continue
        pais = clean(r[col(hdr, 'PAÍS')]) or 'Sin dato'
        proc.append({'pais': pais, 'ciudad': clean(r[col(hdr, 'CIUDAD')]), 'institucion': inst,
                     'caracter': clean(r[col(hdr, 'CARÁCTER')]), 'tipo': tipo_conv(r[col(hdr, 'TIPO DE CONVENIO')]),
                     'rectorias': clean(r[col(hdr, 'RECTORÍAS EN LAS QUE APLICA')]) or 'Sin especificar'})

    # Vencidos (histórico): se agrega, no se lista
    hdr, rows = header_rows(wb['VENCIDOS'])
    venc = []
    for r in rows:
        inst = clean(r[col(hdr, 'INSTITUCIÓN')])
        if not inst:
            continue
        pais = clean(r[col(hdr, 'PAÍS')]) or 'Sin dato'
        v = r[col(hdr, 'FECHA DE VENCIMIENTO')]
        venc.append({'pais': pais, 'ambito': 'Nacional' if pais == 'Colombia' else 'Internacional',
                     'tipo': tipo_conv(r[col(hdr, 'TIPO DE CONVENIO')]),
                     'anio_venc': v.year if isinstance(v, (dt.datetime, dt.date)) else None,
                     'motivo': motivo(r[col(hdr, 'POR QUÉ NO SE RENOVÓ?')])})

    # Redes
    hdr, rows = header_rows(wb['REDES Y PROGRAMAS'])
    redes = []
    for r in rows:
        red = clean(r[col(hdr, 'RED')])
        if not red:
            continue
        pg = norm(r[col(hdr, 'PAGA/GRATUITA')])
        costo = ('Gratuita' if ('GRATUITA' in pg or 'NO HAY CUOTA' in pg) else
                 'Con costo' if (pg and ('PAGA' in pg or 'REQUIERE CUOTA' in pg or 'CUOTA' in pg)) else 'Sin dato')
        area = clean(r[col(hdr, 'ÁREA DE CONOCIMIENTO')])
        if area:
            area = area.replace('deEducación', 'de Educación')
        redes.append({'red': red, 'area': area or 'Institucional / transversal',
                      'sede': clean(r[col(hdr, 'SEDE APLICA')]) or 'Sin dato', 'costo': costo,
                      'info': (clean(r[col(hdr, 'INFORMACIÓN')]) or '')[:260]})
    return {'vigentes': vig, 'en_proceso': proc, 'vencidos': venc, 'redes': redes}


# ------------------------------------------------------------ PATROCINIOS
PUBLICO = ('GOBERNACI', 'ALCALDI', 'MUNICIPIO', 'INSTITUTO COLOMBIANO DE BIENESTAR', 'SERVICIO NACIONAL DE APRENDIZAJE')
JURIDICA = ('S.A', 'SAS', 'S A', 'LTDA', 'LIMITADA', 'FUNDACION', 'COOPERATIVA', 'CORPORACION', 'ASOCIACION', 'COLEGIO',
            'CAMARA', 'FONDO', 'EMPRESA', 'GRUPO', 'INSTITUTO', 'SERVICIO', 'MUNICIPIO', 'GOBERNACI', 'ALCALDI', 'HIJAS',
            'PROPIEDAD', 'SOCIEDAD', 'BIC', 'ENERGRU', 'JUJU', 'RADIO', 'DISTRIBUIDORA', 'CENTRAL', 'MERCANTIL', 'INGESOFTNET',
            'INVERSIONES', 'MOTORES', 'PROYECTOS', 'COSMO', 'CDA', 'BAXELCO', 'INGEMOL', 'INGENCOL', 'RIVERAGRO', 'SEAPTO',
            'ROOTT', 'MAKRO', 'AGUAS', 'G Y J', 'G.E.C.S', 'MOTO ZONE', 'AMR', 'REVISORIA', 'MUNOZ', 'ODIR', 'RFP', 'CASATORO',
            'CONSTRUCCIONES')


def es_persona_natural(name):
    n = norm(name)
    return not any(k in n for k in JURIDICA)


def entidad_base(raw):
    s = re.sub(r'\*+', '', str(raw))
    mod = 'Matrícula (pregrado)'
    if re.search(r'\(EDUCON\)', s, re.I):
        mod = 'Educación continua'
        s = re.sub(r'\(EDUCON\)', '', s, flags=re.I)
    if re.search(r'-\s*TLB\b', s):
        mod = 'Técnico laboral (TLB)'
        s = re.sub(r'-\s*TLB\b', '', s)
    s = re.sub(r'\s+', ' ', s).strip(' .')
    s = s.replace('S.A.S .', 'S.A.S').replace('S.A.S', 'S.A.S')
    return s, mod


def title_entity(s):
    keep = {'S.A.S', 'SAS', 'S.A', 'S.A.', 'LTDA', 'SENA', 'BIC', 'E.S.P', 'ANATO', 'COASMEDAS', 'RC', 'R', 'C', 'TW', 'CDA', 'AMR', 'O.P', 'G.E.C.S', 'G', 'Y', 'J'}
    small = {'DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'E', 'EN', 'POR', 'CON'}
    words = []
    for i, w in enumerate(s.split(' ')):
        if w.upper() in keep and not (w.upper() in small and i):
            words.append(w.upper())
        elif w.upper() in small and i:
            words.append(w.lower())
        else:
            words.append(w.capitalize())
    out = ' '.join(words)
    out = out.replace('Bienestar', 'Bienestar Familiar') if out.endswith('Colombiano de Bienestar') else out
    out = re.sub(r'\s(S\.A\.S|SAS)$', ' S.A.S.', out)
    for a, b in FIXES.items():
        out = out.replace(a, b)
    return out


FIXES = {
    'Alcaldia': 'Alcaldía', 'Gobernacion': 'Gobernación', 'Camara': 'Cámara', 'Asociacion': 'Asociación',
    'Corporacion': 'Corporación', 'Organizacion': 'Organización', 'Fundacion': 'Fundación', 'Lerida': 'Lérida',
    'Boyaca': 'Boyacá', 'Revisoria': 'Revisoría', 'Revision': 'Revisión', 'Estacion': 'Estación',
    'Gutierrez': 'Gutiérrez', 'Arevalo': 'Arévalo', 'Ingenieria': 'Ingeniería', 'Ferreterias': 'Ferreterías',
    'Gestion': 'Gestión', 'Podra': 'Podrá', 'Casatoro S.a.bic': 'Casatoro S.A. BIC', 'Rfp ': 'RFP ',
    'S A': 'S.A.', 'Seapto S.A': 'Seapto S.A.', 'Colpatria S.A': 'Colpatria S.A.', 'Huila S.A E.S.P': 'Huila S.A. E.S.P.',
    'Cooperativa de los Profesionales COASMEDAS la Cual Podrá Identificarse con la Sigla COASMEDAS': 'Cooperativa de los Profesionales COASMEDAS',
    'Cámara de Comercio de la Dorada Puerto Boyacá Puerto Salgar y Oriente de Caldas': 'Cámara de Comercio de La Dorada, Puerto Boyacá, Puerto Salgar y Oriente de Caldas',
    'Municipio del Agrado': 'Municipio de El Agrado', 'O.P & S': 'O.P & S.', 'CDA la': 'CDA La',
}


def sector(name):
    return 'Público' if any(k in norm(name) for k in PUBLICO) else 'Privado'


def parse_bloques(ws):
    rows = list(ws.iter_rows(values_only=True))
    cu_row, sub_row = rows[0], rows[1]
    starts = [(i, v) for i, v in enumerate(cu_row) if v]
    starts = [(i, v) for i, v in starts if i > 0]
    blocks = []
    for k, (i, v) in enumerate(starts):
        end = starts[k + 1][0] if k + 1 < len(starts) else len(cu_row)
        est = vlr = None
        for j in range(i, end):
            sh = norm(sub_row[j]) if j < len(sub_row) else ''
            if 'EST' in sh and est is None:
                est = j
            elif 'VLR' in sh and vlr is None:
                vlr = j
        blocks.append((norm(v), est, vlr))
    return rows, blocks


def parse_patrocinios(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    registros, checks = [], []
    naturales = {}
    for name in wb.sheetnames:
        m = re.match(r'^(PATR|DONA) (\d{4}-[12])$', name.strip())
        if not m:
            continue
        tipo = 'Patrocinio' if m.group(1) == 'PATR' else 'Donación'
        periodo = m.group(2)
        ws = wb[name]
        rows, blocks = parse_bloques(ws)
        tot_blk = [b for b in blocks if 'SEDE' in b[0]]
        cu_blk = [b for b in blocks if 'SEDE' not in b[0]]
        sum_v = sum_e = 0
        for r in rows[2:]:
            ent = r[0]
            if not ent or not str(ent).strip():
                break
            if norm(ent).startswith('TOTAL') or norm(ent).startswith('%'):
                if norm(ent).startswith('TOTALES') and tot_blk:
                    _, ce, cv = tot_blk[0]
                    checks.append({'hoja': name, 'total_hoja_vlr': r[cv], 'total_calc_vlr': round(sum_v, 2),
                                   'total_hoja_est': r[ce], 'total_calc_est': sum_e})
                break
            base, mod = entidad_base(ent)
            if es_persona_natural(base):
                key = norm(base)
                naturales.setdefault(key, f'Persona natural (donante {len(naturales) + 1})')
                disp = naturales[key]
                sec = 'Persona natural'
            else:
                disp = title_entity(base)
                sec = sector(base)
            for cuh, ce, cv in cu_blk:
                cu = cu_name(cuh)
                e = r[ce] if ce is not None and ce < len(r) else None
                v = r[cv] if cv is not None and cv < len(r) else None
                e = e if isinstance(e, (int, float)) else 0
                v = v if isinstance(v, (int, float)) else 0
                if not (e or v):
                    continue
                sum_v += v
                sum_e += e
                if cu is None:
                    print(f'  ! {name}: columna de centro fuera de alcance «{cuh}» omitida', file=sys.stderr)
                    continue
                registros.append({'periodo': periodo, 'tipo': tipo, 'entidad': disp, 'sector': sec,
                                  'modalidad': mod, 'cu': cu, 'est': int(e), 'valor': round(float(v))})
    # Consolidado anual por tipología
    cons = []
    if 'CONSOLIDADO' in wb.sheetnames:
        rows = list(wb['CONSOLIDADO'].iter_rows(values_only=True))
        years = [v for v in rows[0] if isinstance(v, int)]
        TIP = {'PART TLB': 'Patrocinio técnico laboral (TLB)', 'PART EDUCON': 'Patrocinio educación continua',
               'PART MATRICULAS': 'Patrocinio matrículas', 'DONACIONES': 'Donaciones'}
        for r in rows[2:]:
            if r[0] in TIP:
                cons.append({'tipologia': TIP[r[0]], 'anios': {str(years[0]): {'est': r[1], 'valor': r[2]},
                                                                 str(years[1]): {'est': r[3], 'valor': r[4]}}})
    return {'registros': registros, 'consolidado': cons}, checks


# ------------------------------------------------------------ MOVILIDAD
def parse_movilidad(paths):
    periodos, por_cu, por_tipo, excl = [], [], [], []
    for p in paths:
        wb = openpyxl.load_workbook(p, data_only=True)
        rows = list(wb.active.iter_rows(values_only=True))
        m = re.search(r'(\d{4}-[12])', str(rows[0][0]))
        per = m.group(1)
        periodos.append(per)
        section, header = None, None
        for r in rows[1:]:
            a = r[0]
            if a is None:
                continue
            t = norm(a)
            if t.startswith('MOVILIDAD'):
                pob = 'Estudiantes' if 'ESTUDIANTIL' in t else 'Profesores y administrativos'
                section = ('cu' if 'CENTRO UNIVERSITARIO' in t else 'tipo', pob)
                header = None
                continue
            if t in ('CENTRO UNIVERSITARIO', 'TIPO DE MOVILIDAD'):
                header = [clean(h) for h in r]
                continue
            if not section or not header or t == 'TOTAL':
                continue
            kind, pob = section
            if kind == 'cu':
                cu = cu_name(a)
                total = r[header.index('Total')] or 0
                if cu is None:
                    if total:
                        excl.append({'periodo': per, 'poblacion': pob, 'centro': clean(a).title(), 'total': total})
                    continue
                meses = {header[i]: (r[i] or 0) for i in range(1, len(header)) if header[i] and header[i] != 'Total'}
                por_cu.append({'periodo': per, 'poblacion': pob, 'cu': cu, 'total': total, 'meses': meses})
            else:
                h = {header[i]: (r[i] or 0) for i in range(1, len(header)) if header[i]}
                raw = clean(a)
                rol, sentido, act = None, None, raw
                mm = re.match(r'^(PROF|ADM/DIR)\s*-\s*(IN|OUT)\s+(.*)$', raw)
                if mm:
                    rol = 'Profesores' if mm.group(1) == 'PROF' else 'Administrativos y directivos'
                    act = mm.group(3).strip()
                if act.lower().startswith('sin tipo'):
                    act = 'Sin tipo (pendiente)'
                act = act[0].upper() + act[1:]
                por_tipo.append({'periodo': per, 'poblacion': pob, 'rol': rol, 'tipo': act,
                                 'entrante': h.get('Entrante', 0), 'saliente': h.get('Saliente', 0),
                                 'nacional': h.get('Nacional', 0), 'internacional': h.get('Internacional', 0),
                                 'total': h.get('Total', 0)})
    order = sorted(set(periodos))
    return {'periodos': order, 'por_cu': por_cu, 'por_tipo': por_tipo, 'excluidos': excl}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--convenios', required=True)
    ap.add_argument('--patrocinios', required=True)
    ap.add_argument('--movilidad', nargs='+', required=True)
    ap.add_argument('--corte', default=dt.date.today().isoformat())
    ap.add_argument('--out', default='data.json')
    a = ap.parse_args()

    conv = parse_convenios(a.convenios)
    pat, checks = parse_patrocinios(a.patrocinios)
    mov = parse_movilidad(a.movilidad)

    ok = True
    for c in checks:
        dv = abs((c['total_hoja_vlr'] or 0) - c['total_calc_vlr'])
        flag = 'OK' if dv < 2 else 'DIFERENCIA'
        ok &= flag == 'OK'
        print(f"  {c['hoja']:<12} valor hoja {c['total_hoja_vlr']:>16,.0f}  calculado {c['total_calc_vlr']:>16,.0f}  "
              f"est hoja {c['total_hoja_est']}  calc {c['total_calc_est']}  {flag}")

    data = {
        'corte': a.corte,
        'convenios': conv,
        'patrocinios': pat,
        'movilidad': mov,
    }
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"Convenios vigentes: {len(conv['vigentes'])} · en proceso: {len(conv['en_proceso'])} · "
          f"vencidos: {len(conv['vencidos'])} · redes: {len(conv['redes'])}")
    print(f"Patrocinios/donaciones: {len(pat['registros'])} registros entidad×centro×periodo")
    print(f"Movilidad: periodos {mov['periodos']} · excluidos {mov['excluidos']}")
    print('Validación de totales:', 'correcta' if ok else 'REVISAR')


if __name__ == '__main__':
    main()

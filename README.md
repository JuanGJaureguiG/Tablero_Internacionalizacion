# Tablero de Internacionalización · UNIMINUTO Sede Tolima-Huila

Tablero interactivo de convenios y redes, patrocinios y donaciones y movilidad académica, publicado en GitHub Pages.

## Archivos
| Archivo | Función |
|---|---|
| `index.html` | Estructura del tablero |
| `styles.css` | Sistema visual (barra lateral oscura, Space Grotesk + IBM Plex Sans) |
| `app.js` | Filtros por pestaña, KPIs, gráficos (Chart.js 4.4.1) y tablas |
| `data.json` | Datos agregados e institucionales (sin información personal) |
| `build_data.py` | Genera `data.json` a partir de los Excel |

## Pestañas ↔ archivos
- **Convenios y redes** ← `Consolidado_convenios_y_redes_internacionales_Activos_a_11.2026.xlsx`
  (hojas Internacionales, Nacionales, En proceso, Vencidos, Redes y programas)
- **Patrocinios y donaciones** ← `CONSOLIDADO_PATROCINIOS_Y_DONACIONES.xlsx`
  (hojas PATR y DONA de 2025-1, 2025-2, 2026-1 y 2026-2)
- **Movilidad** ← `Consolidado_Movilidad_2024-1.xlsx` … `Consolidado_Movilidad_2026-1.xlsx` (hoja Resumen)

## Filtros
Cada pestaña tiene sus propios filtros en la barra lateral:
- Convenios: ámbito, aplicabilidad a la sede, estado de actividad, región, tipo de convenio y cobertura de redes.
- Patrocinios: periodo, tipo de aporte, Centro Universitario, sector del aportante y modalidad de formación.
- Movilidad: periodo, población y Centro Universitario.

## Actualizar los datos
```bash
pip install openpyxl
python3 build_data.py \
  --convenios Consolidado_convenios_y_redes_internacionales_Activos_a_11.2026.xlsx \
  --patrocinios CONSOLIDADO_PATROCINIOS_Y_DONACIONES.xlsx \
  --movilidad Consolidado_Movilidad_2024-1.xlsx Consolidado_Movilidad_2024-2.xlsx \
              Consolidado_Movilidad_2025-1.xlsx Consolidado_Movilidad_2025-2.xlsx \
              Consolidado_Movilidad_2026-1.xlsx \
  --corte 2026-11-11
```
Para agregar un periodo de movilidad nuevo, añade su archivo a la lista de `--movilidad`.
Para un periodo nuevo de patrocinios, basta con que el Excel tenga las hojas `PATR AAAA-S` y `DONA AAAA-S`.
El script compara el total calculado con la fila «TOTALES» de cada hoja de patrocinios y avisa si no coinciden.

Luego sube el nuevo `data.json` al repositorio (Add file → Upload files) y reemplaza el existente.
Si cambia el periodo en curso de patrocinios, actualiza `PER_EN_CURSO` al inicio de `app.js`.

## Reglas de publicación
- Los donantes que son personas naturales se muestran como «Persona natural (donante N)».
- No se publican los enlaces internos de SharePoint del consolidado de convenios.
- Se excluyen de las cifras por centro los Centros Universitarios que ya no hacen parte de la sede (Florencia, Mocoa).

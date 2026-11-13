"""Every graph says what is on its x and y axis.

ensure_axis_labels(fig) is called by the save() functions of the figure scripts, just before saving.
An axis that already has a label keeps it. A missing label is filled in:
  y axis: from the panel title (that is what the bars/lines show, with its unit)
  x axis: from the tick labels (months -> "Month", 06:00 -> "Time of day (IST)", dates -> "Date",
          words -> "Option compared")
Panels where neither works are listed (MISSING) so they can be labelled by hand in the script.
"""
import re
import textwrap

MONTHS = {"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"}
MISSING = []


def _clean(t):
    t = re.sub(r"\s+", " ", (t or "").replace("\n", " ")).strip()
    return "\n".join(textwrap.wrap(t, 30)) if t else ""


def _ticks(axis):
    return [t.get_text().strip() for t in axis.get_ticklabels() if t.get_text().strip()]


def _x_from_ticks(ticks):
    if not ticks:
        return ""
    low = [t.lower() for t in ticks]
    if all(t[:3] in MONTHS for t in low):
        return "Month"
    if all(re.fullmatch(r"\d{1,2}:\d{2}", t) for t in ticks):
        return "Time of day (IST)"
    if all(re.match(r"\d{4}-\d{2}(-\d{2})?", t) or re.match(r"\d{1,2} [A-Za-z]{3}", t) for t in ticks):
        return "Date"
    if any(re.search(r"[A-Za-z]", t) for t in ticks):
        return "Option compared"
    return ""


def ensure_axis_labels(fig, name=""):
    fig.canvas.draw()                                   # tick labels exist only after a draw
    added = 0
    for ax in fig.axes:
        if not ax.axison or ax.get_label() == "<colorbar>":
            continue
        if not (ax.lines or ax.patches or ax.collections or ax.images or ax.containers):
            continue                                    # tables and text panels
        title = ax.get_title() or ax.get_title("left")
        if ax.yaxis.get_visible() and _ticks(ax.yaxis) and not ax.get_ylabel():
            if title:
                flat = re.sub(r"\s+", " ", title.replace("\n", " ")).strip()
                unit = re.search(r"\(([^()]*)\)\s*$", flat)
                use_unit = unit and len(unit.group(1)) > 5 and not re.match(r"^(of|plain|final)", unit.group(1))
                ax.set_ylabel(_clean(unit.group(1)) if use_unit else "\n".join(textwrap.wrap(flat, 24)))
                added += 1
            else:
                MISSING.append((name, "y"))
        if ax.xaxis.get_visible() and _ticks(ax.xaxis) and not ax.get_xlabel():
            x = _x_from_ticks(_ticks(ax.xaxis))
            if x:
                ax.set_xlabel(x)
            else:
                MISSING.append((name, "x"))
    if added >= 2:                                      # side-by-side panels: room for the new y labels
        fig.subplots_adjust(wspace=max(fig.subplotpars.wspace, 0.55))

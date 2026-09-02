from pathlib import Path

text = Path(r"C:\Users\Asus\OneDrive\Desktop\Ecommerce_pf\frontend\orders.html").read_text(encoding="utf-8")
marker = "document.addEventListener('DOMContentLoaded'"
pos = text.find(marker)
start = text.rfind("<script>", 0, pos)
end = text.rfind("</script>")
js = text[start + len("<script>"):end]
out = Path(r"C:\Users\Asus\OneDrive\Desktop\Ecommerce_pf\_tmp_orders_script.js")
out.write_text(js, encoding="utf-8")
print("len", len(js), "start", start, "end", end)

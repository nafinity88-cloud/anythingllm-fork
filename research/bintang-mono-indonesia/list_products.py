import urllib.request, xml.etree.ElementTree as ET, re, html, concurrent.futures, datetime
from html.parser import HTMLParser
from collections import defaultdict
from pathlib import Path
base='https://bintangmonoindonesia.com/'
def get(u):
    req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req,timeout=20) as r: return r.read().decode('utf-8','replace')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def urls(name):return [e.text for e in ET.fromstring(get(base+name)).findall('s:url/s:loc',ns)]
class Links(HTMLParser):
    def __init__(self):super().__init__();self.link=None;self.buf=[];self.items=[];self.title=False;self.h=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a' and '/product/' in a.get('href',''):self.link=a['href'];self.buf=[]
        if tag=='h1':self.title=True
    def handle_data(self,data):
        if self.link:self.buf.append(data)
        if self.title:self.h.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.link:
            self.items.append((self.link,' '.join(' '.join(self.buf).split())));self.link=None
        if tag=='h1':self.title=False
products=urls('product-sitemap.xml'); categories=urls('categories-sitemap.xml')
def read_cat(u):
    parser=Links();parser.feed(get(u));return u,parser
data=defaultdict(list);names={};failed=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    pending={ex.submit(read_cat,u):u for u in categories}
    for f,u in pending.items():
        try:
            _,p=f.result(); cat=' '.join(p.h).strip() or u.rstrip('/').split('/')[-1].replace('-',' ').title()
            for link,name in p.items:
                link=link.split('?')[0].rstrip('/')+'/'
                if name and link in products:
                    if link not in data[cat]:data[cat].append(link)
                    names[link]=name
        except Exception as e:failed.append((u,str(e)))
missing=[u for u in products if u not in names]
def read_product(u):
    p=Links();p.feed(get(u));return u,' '.join(p.h).strip()
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    tasks={ex.submit(read_product,u):u for u in missing}
    for f,u in tasks.items():
        try:
            _,name=f.result()
            if name:names[u]=name
        except Exception as e:failed.append((u,str(e)))
out=['# Daftar produk Bintang Mono Indonesia','', 'Sumber: situs resmi dan peta situs produk serta kategori. Diakses 30 Oktober 2026. Daftar mencakup halaman produk yang tercantum pada peta situs; halaman dapat mewakili kelompok produk, bukan selalu satu SKU. Kehadiran halaman tidak memastikan stok atau izin saat ini.','',f'Jumlah halaman produk pada peta situs: **{len(products)}**. Produk dapat muncul pada beberapa kategori.','']
for cat,items in sorted(data.items()):
    out += [f'## {cat}','']
    for u in sorted(items,key=lambda x:names[x].lower()):out.append(f'- [{names[u]}]({u})')
    out.append('')
categorized={u for arr in data.values() for u in arr}
out+=['## Produk lain dalam peta situs','', 'Halaman berikut belum terpetakan ke kategori yang berhasil dibaca.','']
for u in products:
    if u not in categorized:
        name=names.get(u) or '[Nama berdasarkan URL] '+u.rstrip('/').split('/')[-1].replace('-',' ').title()
        out.append(f'- [{name}]({u})')
out+=['','## Sumber dan keterbatasan','',f'- [Peta situs produk]({base}product-sitemap.xml)','- [Peta kategori produk]('+base+'categories-sitemap.xml)',f'- Kategori berhasil dibaca: {len(categories)-sum(1 for u,e in failed if u in categories)} dari {len(categories)}.',f'- Judul yang tidak berhasil diambil dan menggunakan nama dari URL: {sum(1 for u in products if u not in names)}.','- Daftar berdasarkan peta situs dan kategori yang dapat diakses. Produk yang tidak tercantum di peta situs atau hanya disebut dalam artikel mungkin belum tercakup.']
if failed:out+=['','Halaman yang gagal dibaca:']+[f'- {u}: {e}' for u,e in failed]
path=Path('research/bintang-mono-indonesia/Daftar Produk Bintang Mono Indonesia.md');path.write_text('\n'.join(out)+'\n',encoding='utf-8')
print('products',len(products),'categories',len(categories),'mapped',len(categorized),'names',len(names),'failures',len(failed),'file',path.resolve())

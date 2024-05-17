select
  from_page.url
, link.text
, link.href
from link
inner join page as from_page on from_page.id = link.from_page_id
inner join page as to_page on to_page.id = link.to_page_id
where to_page.status = 404

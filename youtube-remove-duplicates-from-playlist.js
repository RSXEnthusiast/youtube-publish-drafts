// Credit: https://stackoverflow.com/a/69869011

// This only removes duplicates if they're next to each other in the playlist, so make sure to sort the playlist by date published or something so duplicates are next to each other.

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeduplicates() {
    let titles = document.querySelectorAll('#primary #video-title')
    let href_pattern = RegExp('https?://www\\.youtube\\.com/watch\\?v=[^&]*&list=[^&]*&index=')
    titles = Array.from(titles).filter(t => href_pattern.test(t.href))
    let lastid='';
    for (let i = 0; i < titles.length; i++) {
        let id = titles[i].href.match(/\\?v=([^&]+)/)[1]
        if(id == lastid){
            titles[i].focus()
            titles[i].parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('button[aria-label="Action menu"]').click()
            await sleep(100)
            var things = document.evaluate(
                '//span[contains(text(),"Remove from")]',
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            await sleep(300)
            for (var j = 0; j < things.snapshotLength; j++) {
                things.snapshotItem(j).click();
            }
            console.log(titles[i].innerText)
        }
        lastid=id;
    }
}

removeduplicates()

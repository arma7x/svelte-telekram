<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { Api, client, cachedDatabase } from '../../../utils/bootstrap';
  import { Readability, isProbablyReaderable } from '@mozilla/readability';
  import DOMPurify from 'dompurify';
  import { OptionMenu, LoadingBar } from '../../../components';
  import InstantView from './InstantView.svelte';
  import ReaderView from './ReaderView.svelte';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let loadingBar: LoadingBar;
  let menu: OptionMenu;
  let reader: ReaderView;
  let instantView: InstantView;

  function showLoadingBar() {
    loadingBar = new LoadingBar({
      target: document.body,
      props: {
        onOpened: () => {
          parentNavInstance.detachListener();
        },
        onClosed: () => {
          parentNavInstance.attachListener();
          loadingBar = null;
        }
      }
    });
  }

  function actionMenu() {
    setTimeout(() => {
      let _menu = [{ title: 'Open with Reader View' }, { title: 'Open in In-App Browser' }, { title: 'Open in Browser' }];
      //if (message.media.webpage.cachedPage) {
      //  _menu = [{ title: 'Open in Instant View' }, ..._menu];
      //}
      menu = new OptionMenu({
        target: document.body,
        props: {
          title: 'Action Menu',
          focusIndex: 0,
          options: _menu,
          softKeyCenterText: 'select',
          onSoftkeyRight: (evt, scope) => {},
          onSoftkeyLeft: (evt, scope) => {},
          onEnter: (evt, scope) => {
            menu.$destroy();
            if (scope.selected.title === 'Open in In-App Browser') {
              window.open(message.media.webpage.url);
            } else if (scope.selected.title === 'Open in Browser') {
              window.open(message.media.webpage.url, '_blank').focus();
            } else if (scope.selected.title === 'Open with Reader View') {
              getReaderable();
            } else if (scope.selected.title === 'Open in Instant View') {
              getInstantView();
            }
          },
          onBackspace: (evt, scope) => {
            evt.preventDefault();
            evt.stopPropagation();
            menu.$destroy();
          },
          onOpened: () => {
            parentNavInstance.detachListener();
          },
          onClosed: (scope) => {
            parentNavInstance.attachListener();
            menu = null;
          }
        }
      });
    }, 100);
  }

  function openReader(title, template) {
    setTimeout(() => {
      reader = new ReaderView({
        target: document.body,
        props: {
          template: template,
          onEnter: (evt) => {},
          onBackspace: (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            reader.$destroy();
          },
          onOpened: () => {
            parentNavInstance.detachListener();
          },
          onClosed: () => {
            parentNavInstance.attachListener();
            reader = null;
          }
        }
      });
    }, 100);
  }

  async function getReaderable() {
    const webpageId = message.media.webpage.id.value.toString()
    let cached = await (await cachedDatabase).get('offlineWebpages', webpageId);
    if (cached != null) {
      const sanitizedContent = DOMPurify.sanitize(cached);
      openReader('Reader View', sanitizedContent);
      return;
    }
    if (loadingBar == null)
      showLoadingBar();
    const xhttp = new XMLHttpRequest({ mozSystem: true });
    xhttp.onreadystatechange = async function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        const parser = new DOMParser();
        try {
          const doc = parser.parseFromString(xhttp.responseText, "text/html");
          if (isProbablyReaderable(doc)) {
            const url = new URL(message.media.webpage.url);
            const result = new Readability(doc).parse();
            result.content = result.content.replace(/(<img[^>]*?) *\/?>/g, '$1 style="width:100%;height:auto;" />');
            result.content = result.content.replaceAll(document.location.origin, url.origin);
            result.content = `<style>img{}</style><h4 style="margin-top:0px;padding-top:0px;">${message.media.webpage.title}</h4>` + result.content;
            await (await cachedDatabase).put('offlineWebpages', result.content, webpageId);
            const sanitizedContent = DOMPurify.sanitize(result.content);
            openReader('Reader View', sanitizedContent);
            if (loadingBar)
              loadingBar.$destroy();
          } else {
            console.log('notReaderable');
          if (loadingBar)
            loadingBar.$destroy();
          }
        } catch (e) {
          console.log(e);
          if (loadingBar)
            loadingBar.$destroy();
        }
      } else if (xhttp.readyState == 4 && xhttp.status != 200) {
        console.log(xhttp.status);
        if (loadingBar)
          loadingBar.$destroy();
      }
    };
    xhttp.open("GET", `https://api.codetabs.com/v1/proxy/?quest=${message.media.webpage.url}`, true);
    xhttp.send();
  }

  function getInstantView() {
    setTimeout(() => {
      instantView = new InstantView({
        target: document.body,
        props: {
          blocks: message.media.webpage.cachedPage.blocks,
          onEnter: (evt, scope) => {},
          onBackspace: (evt, scope) => {
            evt.preventDefault();
            evt.stopPropagation();
            instantView.$destroy();
          },
          onOpened: () => {
            parentNavInstance.detachListener();
          },
          onClosed: (scope) => {
            parentNavInstance.attachListener();
            instantView = null;
          }
        }
      });
    }, 100);
  }

  onMount(() => {
    // console.log(message.media);
    // .webpage: description, displayUrl, siteName, title, url, cachedPage(instantview)
    registerCallButtonHandler(message.id.toString(), actionMenu);
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="media-container">
  <div class="quote">
    {#if message.media.webpage.siteName}
    <h5 class="site-name">{message.media.webpage.siteName}</h5>
    {/if}
    {#if message.media.webpage.title}
    <p class="title">{message.media.webpage.title.length > 20 ? message.media.webpage.title.substring(0, 20) + '...' : message.media.webpage.title}</p>
    {/if}
    {#if message.media.webpage.description}
    <p class="description">{message.media.webpage.description.length > 50 ? message.media.webpage.description.substring(0, 50) + '...' : message.media.webpage.description}</p>
    {/if}
  </div>
</div>

<style>
.media-container {
  text-align: start;
}

.media-container > .quote {
  display: flex;
  flex-direction: column;
  padding: 2px 0px 2px 3px;
  margin-bottom: 3px;
  border-left: 1px solid var(--themeColor);
  font-size: 95%;
}

.media-container > .quote > .site-name {
  margin: 0px 0px 2px 0px;
  padding: 0px;
}

.media-container > .quote > .title {
  margin: 0px 0px 2px 0px;
  padding: 0px;
}

.media-container > .quote > .description {
  margin: 0px 0px 2px 0px;
  padding: 0px;
  font-size: 90%;
}
</style>

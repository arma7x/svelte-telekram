<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { Api, client } from '../../../utils/bootstrap';
  import { Readability, isProbablyReaderable } from '@mozilla/readability';
  import DOMPurify from 'dompurify';
  import { OptionMenu, Dialog } from '../../../components';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let menu: OptionMenu;
  let reader: Dialog;

  function actionMenu() {
    setTimeout(() => {
      let menu = [{ title: 'Open in In-App Browser' }, { title: 'Open in Browser' }, { title: 'Open in Reader View' }];
      if (message.media.webpage.cachedPage) {
        menu = [{ title: 'Open in Instant View' }, ...menu];
      }
      menu = new OptionMenu({
        target: document.body,
        props: {
          title: 'Action Menu',
          focusIndex: 0,
          options: menu,
          softKeyCenterText: 'select',
          onSoftkeyRight: (evt, scope) => {},
          onSoftkeyLeft: (evt, scope) => {},
          onEnter: (evt, scope) => {
            menu.$destroy();
            if (scope.selected.title === 'Open in In-App Browser') {
              window.open(message.media.webpage.url);
            } else if (scope.selected.title === 'Open in Browser') {
              window.open(message.media.webpage.url, '_blank').focus();
            } else if (scope.selected.title === 'Open in Reader View') {
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
      reader = new Dialog({
        target: document.body,
        props: {
          title: title,
          body: template,
          html: true,
          softKeyCenterText: '',
          softKeyRightText: 'Close',
          onSoftkeyLeft: (evt) => {},
          onSoftkeyRight: (evt) => {
            reader.$destroy();
          },
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

  function getReaderable() {
    const xhttp = new XMLHttpRequest({ mozSystem: true });
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        const parser = new DOMParser();
        try {
          const doc = parser.parseFromString(xhttp.responseText, "text/html");
          if (isProbablyReaderable(doc)) {
            const result = new Readability(doc).parse();
            result.content = result.content.replace(/<img .*?>/g,"");
            result.content = `<h4 style="margin-top:0px;padding-top:0px;">${message.media.webpage.title}</h4>` + result.content;
            const sanitizedContent = DOMPurify.sanitize(result.content);
            openReader('Reader View', sanitizedContent);
          } else {
            console.log('notReaderable');
          }
        } catch (e) {
          console.log(e);
        }
      } else if (xhttp.readyState == 4 && xhttp.status != 200) {
        console.log(xhttp.status);
      }
    };
    xhttp.open("GET", `https://api.codetabs.com/v1/proxy/?quest=${message.media.webpage.url}`, true);
    xhttp.send();
  }

  function getInstantView() {
    // TODO
    console.log(message.media.webpage.cachedPage.blocks);
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

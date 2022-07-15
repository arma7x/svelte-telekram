<script lang="ts">
  import { Router, Route, Link } from 'svelte-navigator';
  import { AppBar, SoftwareKey } from './components';
  import { Home } from './routes';
  import { Bot, Channel, Group, User } from './routes/rooms';
  import { onMount, onDestroy } from 'svelte';
  import { Localization } from './utils/localization';

  export let localization = new Localization('en-US', 'langs');
  export let appBar;
  export let softwareKey;

  export const getAppProp = () => {
    return {appBar, softwareKey, localization};
  }

  onMount(() => {
    console.log('onMount', 'App');
  });

</script>

<Router>
  <div id="kai-status-bar"></div>
  <AppBar bind:this={appBar} />
  <main>
    <Route primary={false} path="index.html" let:location let:navigate>
      <svelte:component this="{Home}" {location} {navigate} {getAppProp}/>
    </Route>
    <Route primary={false} path="bot" let:location let:navigate>
      <svelte:component this="{Bot}" {location} {navigate} {getAppProp}/>
    </Route>
    <Route primary={false} path="channel" let:location let:navigate>
      <svelte:component this="{Channel}" {location} {navigate} {getAppProp}/>
    </Route>
    <Route primary={false} path="group" let:location let:navigate>
      <svelte:component this="{Group}" {location} {navigate} {getAppProp}/>
    </Route>
    <Route primary={false} path="user" let:location let:navigate>
      <svelte:component this="{User}" {location} {navigate} {getAppProp}/>
    </Route>
  </main>
  <SoftwareKey bind:this={softwareKey} />
</Router>

<style>
  #kai-status-bar {
    height: 26px;
    width: 100%;
    background-color: var(--themeColor);
  }
  main {
    display: flex;
    top: 54px;
    margin: 0px;
    padding: 0px;
    position: fixed;
    text-align: center;
    width: 100%;
    height: calc(100% - 84px);
    overflow: scroll;
  }
  :global(._toastItem) {
    text-align: center!important;
  }
</style>

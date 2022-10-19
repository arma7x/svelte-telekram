<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { OptionMenu } from '../../../components';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let callButtonCallback: Function = (id, callback) => {}
  export let fetchMessageCallback: Function = (id: number) => {}

  let menu: OptionMenu;

  let url: string = '';

  // https://help.openstreetmap.org/questions/20335/embedded-html-displays-zoomed-out/51323
  function getCoordOffset($what, $lat, $lon, $offset) {
    var $earthRadius = 6378137;
    var $coord = [$lat, $lon];
    var $radOff = $what === 0 ? $offset / $earthRadius : $offset / ($earthRadius * Math.cos(Math.PI * $coord[0] / 180));
    return $coord[$what] + $radOff * 180 / Math.PI;
  }

  function getBBox($lat, $lon, $area) {
    var $offset = $area / 2;
    // 0 = minlon, 1 = minlat, 2 = maxlon, 3 = maxlat, 4,5 = original val (marker)
    return [
      getCoordOffset(1, $lat, $lon, -$offset),
      getCoordOffset(0, $lat, $lon, -$offset),
      getCoordOffset(1, $lat, $lon, $offset),
      getCoordOffset(0, $lat, $lon, $offset),
      $lat,
      $lon
    ];
  }

  function getOpenStreetMapEmbed(lat, long) {
    var result = getBBox(lat, long, 10);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${result[0]},${result[1]},${result[2]},${result[3]}&layer=mapnik&marker=${lat},${long}`;
  }

  function getGoogleMapEmbed(lat, long) {
    return `https://maps.google.com/maps?width=100px;height=100px&hl=en&q=${lat},${long}+(Location)&t=&z=15&ie=UTF8&iwloc=B&output=embed`
  }

  function actionMenu() {
    setTimeout(() => {
      menu = new OptionMenu({
        target: document.body,
        props: {
          title: 'Action Menu',
          focusIndex: 0,
          options: [{ title: 'Open in Google Map' }, { title: 'Open in OpenStreetMap' }],
          softKeyCenterText: 'select',
          onSoftkeyRight: (evt, scope) => {},
          onSoftkeyLeft: (evt, scope) => {},
          onEnter: (evt, scope) => {
            menu.$destroy();
            if (scope.selected.title === 'Open in Google Map') {
              window.open(`https://www.google.com/maps/search/?api=1&query=${message.media.geo.lat},${message.media.geo.long}`, '_blank').focus();
            } else if (scope.selected.title === 'Open in OpenStreetMap') {
              const url = getOpenStreetMapEmbed(message.media.geo.lat, message.media.geo.long);
              window.open(url, '_blank').focus();
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

  beforeUpdate(() => {
    url = getGoogleMapEmbed(message.media.geo.lat, message.media.geo.long);
  });

  onMount(() => {
    callButtonCallback(message.id.toString(), actionMenu);
  })

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <div style="width: 100%"><iframe width="100%" height="100" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src={url}></iframe></div>
</div>

<style>
.media-container {
  text-align: start;
}
</style>

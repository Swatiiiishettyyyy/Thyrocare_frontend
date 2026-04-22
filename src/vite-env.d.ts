/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Mapbox token (URL-restricted) for address autocomplete / reverse geocoding. */
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string
}

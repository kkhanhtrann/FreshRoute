export const SLC_LAT = 40.7608;
export const SLC_LON = -111.8910;
export const BOX_SIZE = 0.1; // 0.1 degrees ~ 11 km at the equator

export const SLC_VIEWBOX = [
    SLC_LON - BOX_SIZE, SLC_LAT + BOX_SIZE,  // top-left (NW)
    SLC_LON + BOX_SIZE, SLC_LAT - BOX_SIZE   // bottom-right (SE)
].join(',');
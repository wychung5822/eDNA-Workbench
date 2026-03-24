import { mapImages } from "../../data/mapImages.js";
import "../styles/TaiwanMapComponent.css";


const MapControls = ({
  imgW, imgH,
  lonRange, latRange,
  lonDirMin, lonDirMax, latDirMin, latDirMax,
  setImgW, setImgH,
  setLonRange, setLatRange,
  setLonDirMin, setLonDirMax, setLatDirMin, setLatDirMax,
  activeMapId, setActiveMapId,
  setMapImage,
  handleImageUpload,
  handleSwitchMap
}) => {
  const resetMapSettings = () => {
    // 重置圖片尺寸和經緯度設置
    setImgW('');
    setImgH('');
    setLonRange([0, 0]);
    setLatRange([0, 0]);
    setLonDirMin('E');
    setLonDirMax('W');
    setLatDirMin('N');
    setLatDirMax('S');
  };

  return (
    <div className="map-settings-container">
      {/* 📁 上傳 & 地圖清單 */}
      <div className="map-upload-column">
        <div className="map-select-container">
          <label>Select Map Image: 
            <select
              value={activeMapId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setActiveMapId("");
                  setMapImage(null);
                  resetMapSettings();  // Clear settings
                } else if (value === "Customize") {
                  setActiveMapId("Customize");
                  setMapImage(null);
                  resetMapSettings();  // Clear settings
                } else {
                  const map = mapImages.find((m) => m.id === value);
                  if (map) handleSwitchMap(map);
                }
              }}
            >
              <option value="">------ Select------</option>
              {mapImages.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
              <option value="Customize">Custom-Map</option>
            </select>
          </label>
        </div>

        <div className="map-upload-container" style={{ whiteSpace: "nowrap" }}>
          <label>Upload Map Image (.png):</label>
          <input
            id="mapImageFile"
            type="file"
            accept="image/png"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <label htmlFor="mapImageFile" className="map-file-label">
            Choose File
          </label>          
        </div>


        {/* 提醒框 
        {(activeMapId === "" ) && (
          <div className="warning-box">
            <strong>⚠️ Please select or upload a Map Image.</strong>
          </div>
        )}
        */}
      </div>

      {/* 🖼️ 圖片尺寸設定 */}
      <div className="map-image-settings-column">
        {(activeMapId && activeMapId !== "") && (
          <>
            <div className="size-settings">
              <label style={{ whiteSpace: "nowrap" }}>Image Width: </label>
              <input
                type="number"
                value={imgW ?? ""}
                onChange={(e) => setImgW(Number(e.target.value))}
                className="small-input"
              />
              <label>Height: </label>
              <input
                type="number"
                value={imgH ?? ""}
                onChange={(e) => setImgH(Number(e.target.value))}
                className="small-input"
              />

              <button
                onClick={() => {
                  setImgW(Math.round(imgW * 1.25));
                  setImgH(Math.round(imgH * 1.25));
                }}
                style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                🔍+
              </button>
              <button
                onClick={() => {
                  setImgW(Math.round(imgW * 0.8));
                  setImgH(Math.round(imgH * 0.8));
                }}
                style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                🔍-
              </button>
            </div>

            {/* 經度和緯度範圍設定 */}
            <div className="range-settings">
              {/* 經度 */}
              <div className="range-input-row">
                <label style={{ whiteSpace: "nowrap" }}>Longitude Range: </label>
                <select
                  value={lonDirMin}
                  onChange={(e) => {
                    setLonDirMin(e.target.value);
                    setLonRange([Math.abs(lonRange[0]) * (e.target.value === "E" ? 1 : -1), lonRange[1]]);
                  }}
                >
                  <option value="E">E</option>
                  <option value="W">W</option>
                </select>
                <input
                  type="number"
                  value={Math.abs(lonRange[0])}
                  onChange={(e) =>
                    setLonRange([+e.target.value * (lonDirMin === "E" ? 1 : -1), lonRange[1]])
                  }
                  className="small-input"
                />
                -
                <select
                  value={lonDirMax}
                  onChange={(e) => {
                    setLonDirMax(e.target.value);
                    setLonRange([lonRange[0], Math.abs(lonRange[1]) * (e.target.value === "E" ? 1 : -1)]);
                  }}
                >
                  <option value="E">E</option>
                  <option value="W">W</option>
                </select>
                <input
                  type="number"
                  value={Math.abs(lonRange[1])}
                  onChange={(e) =>
                    setLonRange([lonRange[0], +e.target.value * (lonDirMax === "E" ? 1 : -1)])
                  }
                  className="small-input"
                />
              </div>

              {/* 緯度 */}
              <div className="range-input-row">
                <label style={{ whiteSpace: "nowrap" }}>Latitude Range: </label>
                <select
                  value={latDirMin}
                  onChange={(e) => {
                    setLatDirMin(e.target.value);
                    setLatRange([Math.abs(latRange[0]) * (e.target.value === "N" ? 1 : -1), latRange[1]]);
                  }}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </select>
                <input
                  type="number"
                  value={Math.abs(latRange[0])}
                  onChange={(e) =>
                    setLatRange([+e.target.value * (latDirMin === "N" ? 1 : -1), latRange[1]])
                  }
                  className="small-input"
                />
                -
                <select
                  value={latDirMax}
                  onChange={(e) => {
                    setLatDirMax(e.target.value);
                    setLatRange([latRange[0], Math.abs(latRange[1]) * (e.target.value === "N" ? 1 : -1)]);
                  }}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </select>
                <input
                  type="number"
                  value={Math.abs(latRange[1])}
                  onChange={(e) =>
                    setLatRange([latRange[0], +e.target.value * (latDirMax === "N" ? 1 : -1)])
                  }
                  className="small-input"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapControls;

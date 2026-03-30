import React, { useEffect, useState } from "react";
import CityPieChart from "./CityPieChart";
import "../styles/TaiwanMapComponent.css";

const MapMainView = ({
  conW,
  conH,
  mapImage,
  imgW,
  imgH,
  filteredCityGeneData,
  cityVisibility,
  setCityVisibility, // 設定城市可見性的函數
  selectedCity,
  setSelectedCity,
  geneColors,
  latLon,
  handleMouseMove,
  decimalToDegreeMinuteWithDir,
  handleExportPNG,
  mapLoaded,
  filteredGeneList,
  setFileName
}) => {

   const filteredGenesSet = new Set(filteredGeneList);

   const [localFileName, setLocalFileName] = useState("picture");
   const [isConfigured, setIsConfigured] = useState(false); // 用來判斷是否完成設定
   
     // 檢查是否所有設定都已完成
     useEffect(() => {
       const isAllConfigured = conW && conH && mapImage && imgW && imgH && 
       filteredCityGeneData && Object.keys(filteredCityGeneData).length > 0 
       ;
       setIsConfigured(isAllConfigured);
     }, [conW, conH, mapImage, imgW, imgH, filteredCityGeneData]);
   
     const handleFileNameChange = (e) => {
       const newFileName = e.target.value;
       setLocalFileName(newFileName); 
       setFileName(newFileName); // 更新父層的檔名
     };
   
  return (
    <div style={{ flex: 1, display: "flex", gap: 16, flexDirection: "column" }}>

      {/* 如果沒有完成設定，顯示提示 */}
      {!isConfigured && (
        <div className="MapMainView-warning-box">
          <p>⚠️ Complete the following settings：</p>
          <ul>
            {!mapImage && <li> Select or upload a map image </li>}
            {!imgW && <li> Enter image Width and Height</li>}
            {(!filteredCityGeneData || Object.keys(filteredCityGeneData).length === 0) && (
              <li> Select one ASV as the target</li>             
            )}
          </ul>
        </div>
      )}

       {/* 如果設定完成，顯示原本的內容 */}
      {isConfigured && (
        <>
          {/* 🔼 Export 按鈕放最上方 */}
            <div style={{ alignSelf: "flex-start", marginBottom: 8 }}>
              <input
                type="text"
                value={localFileName}
                onChange={handleFileNameChange} // 設置檔名
                placeholder="Enter file name"
                className="MapMainView-input-File"
              />
              <button 
                className="MapMainView-button-File"
                onClick={() => handleExportPNG(localFileName)}>Export Map PNG 
              </button>
            </div>

          {/* 🗺️ 地圖容器與城市資訊 */}
          <div style={{ display: "flex", gap: 16, flex: 1, marginTop: "25px"   }}>
            {/* 選中城市基因分布 */}
            {selectedCity && filteredCityGeneData[selectedCity] && (
              <div className="MapMainView-city-info">
                <h4 >{selectedCity} Area</h4>
                <ul>
                  {filteredCityGeneData[selectedCity].data
                  .sort((a, b) => b.value - a.value)
                  .filter((g) => filteredGeneList.includes(g.name))  // 只顯示過濾後的基因
                    .map((g) => (
                    <li
                      key={g.name}
                      style={{ 
                        display: "flex", 
                        alignItems: "center",
                        gap: 3,
                        maxWidth: "100%"
                      }}
                    >
                      <div
                        style={{  
                          background: geneColors[g.name] || "var(--primary)"
                        }}
                      />
                       <span style={{ whiteSpace: "nowrap" }}>{g.name}: {g.value}</span>
                    </li>
                  ))}
                </ul>
                <div className="total-count">
                  Total quantity: {filteredCityGeneData[selectedCity].totalCount}
                </div>
              </div>
            )}

            {/* 地圖本體 */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                id="map-container"
                style={{
                  position: "relative",
                  width: conW + 50 ,
                  height: conH,
                  userSelect: "none"
                }}
                onMouseMove={handleMouseMove}
              >
                {mapImage && (
                  <img
                    src={mapImage}
                    alt="Map"
                    width={imgW}
                    height={imgH}
                    className="MapMainView-map-image"
                  />
                )}

                {/* 🔹 箭頭圖層 */}
                <svg
                  width={conW}
                  height={conH}
                   className="MapMainView-arrow-svg"
                >
                  <defs>
                    <marker
                      id="arrow"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="gray" />
                    </marker>
                  </defs>
                  {mapLoaded &&
                    Object.entries(filteredCityGeneData).map(([city, chartData]) => {
                      const from = chartData.originalContainerCoordinates;
                      const to = chartData.containerCoordinates; // ✅ 已是圓心
                      const shouldDraw =
                        chartData.line &&
                        from &&
                        to &&
                        (from.cx !== to.cx || from.cy !== to.cy);

                      // 根據城市顯示與否來隱藏虛線
                      if (!cityVisibility[city]) return null;  // 如果城市被隱藏，則不顯示虛線

                      return (
                        shouldDraw && (
                        <React.Fragment key={`line-${city}`}>
                          <line
                            key={`line-${city}`}
                            x1={from.cx || 0}
                            y1={from.cy || 0}
                            x2={to.cx  || 0}
                            y2={to.cy  || 0}
                            stroke="gray"
                            strokeWidth={0.9}
                            strokeDasharray="10,4"
                            markerEnd="url(#arrow)"
                            opacity={0.9}
                          />    
                          <circle
                            cx={from.cx || 0}
                            cy={from.cy || 0}
                            r="2" // radius of the small dot
                            fill="red" // color of the dot
                            opacity={0.9} // optional opacity for the dot
                          />

                        </React.Fragment>         
                        )
                      );               
                    })}
                </svg>

                {/* 🔹 餅圖 */}
                {mapLoaded &&
                  Object.entries(filteredCityGeneData).map(([city, chartData]) => {
                    const filteredData = chartData.data.filter((g) => filteredGeneList.includes(g.name));
                    if (filteredData.length === 0) return null; // 如果過濾後該城市無基因資料，則不顯示
                    return (
                      <CityPieChart
                        key={city}
                        city={city}
                        chartData={{ data: filteredData, totalCount: chartData.totalCount }}
                        geneColors={geneColors}
                        position={chartData.containerCoordinates}
                        opacity={cityVisibility[city] ? 1 : 0}
                        onClick={() => setSelectedCity(city)}
                        isSelected={selectedCity === city}
                      />
                    );
                  })}
              </div>

              {/* 📍 經緯度顯示 */}
              <div className= "MapMainView-latlon-display">
                longitude: {decimalToDegreeMinuteWithDir(parseFloat(latLon.lon), "lon")}
                <br />
                latitude: {decimalToDegreeMinuteWithDir(parseFloat(latLon.lat), "lat")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapMainView;


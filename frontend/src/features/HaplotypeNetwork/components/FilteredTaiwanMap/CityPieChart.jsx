import { memo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import "../styles/TaiwanMapComponent.css";

// ---------- 子元件：城市圓餅圖 ----------
const CityPieChart = memo(
  ({ city, chartData, geneColors, position, opacity, onClick, isSelected, onMouseOver, onMouseOut }) => {
    // 如果没有位置或位置不合法，则不渲染
    if (!position || typeof position.cx !== "number" || typeof position.cy !== "number")
      return null;

    let { data, totalCount } = chartData;
    const outerRadius = Math.min(15 + Math.floor(totalCount / 5) * 5, 25);

    // 根據城市數量排序，最多顯示100個顏色
    data = data.sort((a, b) => b.value - a.value); // 按數量排序，數量多的優先
    const maxDisplayCount = 50;
    if (data.length > maxDisplayCount) {
      data = data.slice(0, maxDisplayCount); // 只顯示前100個
    }

    // 圓心位置
    const labelYPosition = `50%`;

    // 剩餘顏色的數量
    const remainingCount = chartData.data.length - data.length;

    return (
      <div
        className="city-pie-chart"
        style={{
          position: "absolute",
          left: `${position.cx}px`,
          top: `${position.cy}px`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "auto",
          opacity,
          zIndex: 0,
          cursor: "pointer",
        }}
        onClick={onClick}
        onMouseOver={(e) => onMouseOver(e, data)} // Trigger mouseover event
        onMouseOut={onMouseOut} // Trigger mouseout event
      >
        {/* 5x50的小格子顯示地名 */}
        <div
          style={{
            position: "absolute",
            top: "-25px",
            width: "50px",
            height: "20px", // 小格子的高度
            backgroundColor: "var(--bg-page)", // 背景顏色可以根據需要調整
            textAlign: "center",
            lineHeight: "20px", // 使文字垂直居中
            fontSize: "10px", // 字體大小
            fontWeight: "bold",
            borderRadius: "3px var(--primary)", // 圓角
            boxShadow: "0 2px 5px var(--primary)", // 加一些陰影效果
          }}
        >
          {city}
        </div>

        <PieChart width={outerRadius * 2} height={outerRadius * 2}>
          {/* 圓餅圖 */}
          {isSelected && (
            <circle
              cx="50%"
              cy="50%"
              r={outerRadius + 2}
              fill="none"
              stroke="black"
              strokeWidth={4}
            />
          )}

          <Pie
            data={data}
            dataKey="value"
            cx="50%" cy="50%"
            outerRadius={outerRadius}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${city}-${index}`}
                fill={geneColors[entry.name] || "var(--primary)"}
              />
            ))}
          </Pie>

        </PieChart>
      </div>
    );
  },
  (prev, next) =>
    prev.city === next.city &&
    prev.opacity === next.opacity &&
    prev.chartData.totalCount === next.chartData.totalCount &&
    JSON.stringify(prev.chartData.data) === JSON.stringify(next.chartData.data) &&
    prev.position?.cx === next.position?.cx &&
    prev.position?.cy === next.position?.cy &&
    prev.isSelected === next.isSelected
);

export default CityPieChart;
import React from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../theme/tokens';

export interface LineChartData {
  label: string;
  value1: number;
  value2?: number;
}

interface LineChartProps {
  data: LineChartData[];
  color1?: string;
  color2?: string;
  height?: number;
  title?: string;
}

const ChartLine = ({ x1, y1, x2, y2, color }: { x1: number, y1: number, x2: number, y2: number, color: string }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Fallback translation if transformOrigin is not perfectly supported
  const shiftX = length / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - 1.5,
        width: length,
        height: 3,
        backgroundColor: color,
        // For older RN versions, use translateX/Y to pivot around left-center.
        // But for Expo 52, transformOrigin works perfectly.
        transformOrigin: '0% 50%',
        transform: [
          { rotate: `${angle}deg` }
        ],
      }}
    />
  );
};

export default function LineChart({ 
  data, 
  color1 = theme.colors.secondary, 
  color2 = theme.colors.danger, 
  height = 160, 
  title 
}: LineChartProps) {
  const [chartWidth, setChartWidth] = React.useState(0);

  // Find max value to scale chart
  let maxVal = 0;
  data.forEach(d => {
    if (d.value1 > maxVal) maxVal = d.value1;
    if (d.value2 && d.value2 > maxVal) maxVal = d.value2;
  });
  if (maxVal === 0) maxVal = 1;

  const chartHeight = height - 40; // Leave space for labels
  const numPoints = data.length;

  const stepX = chartWidth > 0 ? (chartWidth - 30) / (numPoints - 1 || 1) : 0;
  const offsetX = 15; // padding left/right

  const onLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  return (
    <ChartContainer>
      {title && <ChartTitle>{title}</ChartTitle>}
      
      {data[0]?.value2 !== undefined && (
        <LegendContainer>
          <LegendItem>
            <LegendDot color={color1} />
            <LegendText>Pemasukan</LegendText>
          </LegendItem>
          <LegendItem>
            <LegendDot color={color2} />
            <LegendText>Pengeluaran</LegendText>
          </LegendItem>
        </LegendContainer>
      )}

      <CanvasWrapper style={{ height }} onLayout={onLayout}>
        {chartWidth > 0 && numPoints > 0 && (
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Draw Lines */}
            {data.map((d, i) => {
              if (i === numPoints - 1) return null; // No line from the last point
              
              const nextD = data[i + 1];
              
              const x1 = offsetX + i * stepX;
              const x2 = offsetX + (i + 1) * stepX;
              
              const y1_1 = chartHeight - ((d.value1 / maxVal) * chartHeight);
              const y2_1 = chartHeight - ((nextD.value1 / maxVal) * chartHeight);

              const elements = [];

              // Draw Line 1 (Income)
              elements.push(
                <ChartLine key={`l1-${i}`} x1={x1} y1={y1_1} x2={x2} y2={y2_1} color={color1} />
              );

              // Draw Line 2 (Expense)
              if (d.value2 !== undefined && nextD.value2 !== undefined) {
                const y1_2 = chartHeight - ((d.value2 / maxVal) * chartHeight);
                const y2_2 = chartHeight - ((nextD.value2 / maxVal) * chartHeight);
                elements.push(
                  <ChartLine key={`l2-${i}`} x1={x1} y1={y1_2} x2={x2} y2={y2_2} color={color2} />
                );
              }

              return elements;
            })}

            {/* Draw Dots and Labels */}
            {data.map((d, i) => {
              const x = offsetX + i * stepX;
              const y1 = chartHeight - ((d.value1 / maxVal) * chartHeight);
              const y2 = d.value2 !== undefined ? chartHeight - ((d.value2 / maxVal) * chartHeight) : 0;

              return (
                <React.Fragment key={`p-${i}`}>
                  {/* Dot 2 */}
                  {d.value2 !== undefined && (
                    <View style={{
                      position: 'absolute',
                      left: x - 4,
                      top: y2 - 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color2,
                      borderWidth: 1.5,
                      borderColor: theme.colors.cardBg
                    }} />
                  )}

                  {/* Dot 1 */}
                  <View style={{
                    position: 'absolute',
                    left: x - 4,
                    top: y1 - 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color1,
                    borderWidth: 1.5,
                    borderColor: theme.colors.cardBg
                  }} />
                  
                  {/* Label */}
                  <Text style={{
                    position: 'absolute',
                    left: x - 15,
                    top: height - 15,
                    width: 30,
                    textAlign: 'center',
                    fontSize: 10,
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily
                  }}>
                    {d.label}
                  </Text>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </CanvasWrapper>
    </ChartContainer>
  );
}

const ChartContainer = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  margin-bottom: ${theme.spacing(2.5)}px;
  ${theme.glassShadow}
`;

const ChartTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const LegendContainer = styled.View`
  flex-direction: row;
  margin-bottom: ${theme.spacing(2)}px;
`;

const LegendItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: ${theme.spacing(2)}px;
`;

const LegendDot = styled.View<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.color};
  margin-right: 6px;
`;

const LegendText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 10px;
  color: ${theme.colors.textSecondary};
`;

const CanvasWrapper = styled.View`
  width: 100%;
`;

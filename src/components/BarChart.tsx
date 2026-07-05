import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../theme/tokens';

export interface BarChartData {
  label: string;
  value1: number;
  value2?: number; // Optional second bar for comparison
}

interface BarChartProps {
  data: BarChartData[];
  color1?: string;
  color2?: string;
  height?: number;
  title?: string;
}

export default function BarChart({ 
  data, 
  color1 = theme.colors.secondary, 
  color2 = theme.colors.danger, 
  height = 160, 
  title 
}: BarChartProps) {
  // Find max value to scale bars relative to container height
  let maxVal = 0;
  data.forEach(d => {
    if (d.value1 > maxVal) maxVal = d.value1;
    if (d.value2 && d.value2 > maxVal) maxVal = d.value2;
  });
  if (maxVal === 0) maxVal = 1;

  return (
    <ChartContainer>
      {title && <ChartTitle>{title}</ChartTitle>}
      
      {/* Legend if value2 exists */}
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

      <BarsContainer height={height}>
        {data.map((item, index) => {
          const h1 = (item.value1 / maxVal) * 100;
          const h2 = item.value2 !== undefined ? (item.value2 / maxVal) * 100 : 0;
          return (
            <BarColumn key={index}>
              <BarGroup>
                <BarWrapper>
                  <BarFill style={{ height: `${h1}%`, backgroundColor: color1 }} />
                </BarWrapper>
                {item.value2 !== undefined && (
                  <BarWrapper>
                    <BarFill style={{ height: `${h2}%`, backgroundColor: color2 }} />
                  </BarWrapper>
                )}
              </BarGroup>
              <BarLabel numberOfLines={1}>{item.label}</BarLabel>
            </BarColumn>
          );
        })}
      </BarsContainer>
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

const BarsContainer = styled.View<{ height: number }>`
  height: ${(props) => props.height}px;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 24px; /* Space for label */
`;

const BarColumn = styled.View`
  align-items: center;
  flex: 1;
`;

const BarGroup = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  width: 100%;
`;

const BarWrapper = styled.View`
  width: 10px;
  height: 100%;
  background-color: rgba(255,255,255,0.05);
  border-radius: 6px;
  margin: 0 2px;
  justify-content: flex-end;
  overflow: hidden;
`;

const BarFill = styled.View`
  width: 100%;
  border-radius: 6px;
`;

const BarLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 10px;
  color: ${theme.colors.textSecondary};
  position: absolute;
  bottom: -24px;
  text-align: center;
  width: 150%;
`;

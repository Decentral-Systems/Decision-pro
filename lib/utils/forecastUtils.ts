/**
 * Forecast Utilities
 * Functions for calculating revenue forecasts and confidence intervals
 */

export interface ForecastDataPoint {
  date: string;
  forecast: number;
  upperBound: number; // Upper confidence interval
  lowerBound: number; // Lower confidence interval
  confidence: number; // Confidence level (0-1)
}

export interface HistoricalDataPoint {
  date: string;
  revenue: number;
}

/**
 * Calculate forecast using simple linear regression
 */
export function calculateLinearForecast(
  historicalData: HistoricalDataPoint[],
  forecastPeriods: number = 3
): ForecastDataPoint[] {
  if (historicalData.length < 2) {
    return [];
  }

  // Convert dates to timestamps for regression
  const timestamps = historicalData.map((point) => new Date(point.date).getTime());
  const revenues = historicalData.map((point) => point.revenue);

  // Calculate linear regression
  const n = timestamps.length;
  const sumX = timestamps.reduce((a, b) => a + b, 0);
  const sumY = revenues.reduce((a, b) => a + b, 0);
  const sumXY = timestamps.reduce((sum, x, i) => sum + x * revenues[i], 0);
  const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);
  const sumYY = revenues.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate standard deviation of residuals for confidence intervals
  const residuals = revenues.map((y, i) => {
    const predicted = slope * timestamps[i] + intercept;
    return y - predicted;
  });
  const meanResidual = residuals.reduce((a, b) => a + b, 0) / n;
  const variance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / (n - 2);
  const stdDev = Math.sqrt(variance);

  // Calculate confidence interval multiplier (95% confidence = 1.96 standard deviations)
  const confidenceMultiplier = 1.96;

  // Generate forecast
  const forecasts: ForecastDataPoint[] = [];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const avgTimeStep = (lastTimestamp - timestamps[0]) / (n - 1);

  for (let i = 1; i <= forecastPeriods; i++) {
    const forecastTimestamp = lastTimestamp + avgTimeStep * i;
    const forecastValue = slope * forecastTimestamp + intercept;
    
    // Confidence intervals widen as we forecast further into the future
    const uncertaintyFactor = 1 + (i * 0.1); // 10% increase per period
    const margin = stdDev * confidenceMultiplier * uncertaintyFactor;

    forecasts.push({
      date: new Date(forecastTimestamp).toISOString(),
      forecast: Math.max(0, forecastValue), // Ensure non-negative
      upperBound: Math.max(0, forecastValue + margin),
      lowerBound: Math.max(0, forecastValue - margin),
      confidence: 0.95,
    });
  }

  return forecasts;
}

/**
 * Calculate forecast using moving average with trend
 */
export function calculateMovingAverageForecast(
  historicalData: HistoricalDataPoint[],
  forecastPeriods: number = 3,
  windowSize: number = 3
): ForecastDataPoint[] {
  if (historicalData.length < windowSize) {
    return [];
  }

  // Calculate moving average
  const movingAverages: number[] = [];
  for (let i = windowSize - 1; i < historicalData.length; i++) {
    const window = historicalData.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, point) => sum + point.revenue, 0) / windowSize;
    movingAverages.push(avg);
  }

  // Calculate trend (average change)
  const changes: number[] = [];
  for (let i = 1; i < movingAverages.length; i++) {
    changes.push(movingAverages[i] - movingAverages[i - 1]);
  }
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

  // Calculate standard deviation for confidence intervals
  const lastValues = historicalData.slice(-windowSize).map((p) => p.revenue);
  const mean = lastValues.reduce((a, b) => a + b, 0) / lastValues.length;
  const variance = lastValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / lastValues.length;
  const stdDev = Math.sqrt(variance);
  const confidenceMultiplier = 1.96;

  // Generate forecast
  const forecasts: ForecastDataPoint[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastValue = movingAverages[movingAverages.length - 1];
  const avgTimeStep = (new Date(historicalData[historicalData.length - 1].date).getTime() -
    new Date(historicalData[historicalData.length - windowSize].date).getTime()) / (windowSize - 1);

  for (let i = 1; i <= forecastPeriods; i++) {
    const forecastDate = new Date(lastDate.getTime() + avgTimeStep * i);
    const forecastValue = lastValue + avgChange * i;
    
    const uncertaintyFactor = 1 + (i * 0.15); // 15% increase per period
    const margin = stdDev * confidenceMultiplier * uncertaintyFactor;

    forecasts.push({
      date: forecastDate.toISOString(),
      forecast: Math.max(0, forecastValue),
      upperBound: Math.max(0, forecastValue + margin),
      lowerBound: Math.max(0, forecastValue - margin),
      confidence: 0.95,
    });
  }

  return forecasts;
}

/**
 * Combine historical and forecast data
 */
export function combineHistoricalAndForecast(
  historicalData: HistoricalDataPoint[],
  forecastData: ForecastDataPoint[]
): Array<HistoricalDataPoint & Partial<ForecastDataPoint>> {
  return [
    ...historicalData.map((point) => ({
      ...point,
      forecast: undefined,
      upperBound: undefined,
      lowerBound: undefined,
    })),
    ...forecastData.map((point) => ({
      date: point.date,
      revenue: point.forecast,
      forecast: point.forecast,
      upperBound: point.upperBound,
      lowerBound: point.lowerBound,
      confidence: point.confidence,
    })),
  ];
}




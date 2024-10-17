import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";

// ChartManager class handles the creation, update, and management of a chart using the lightweight-charts library.
export class ChartManager {
  // candleSeries stores the reference to the candlestick series.
  private candleSeries: ISeriesApi<"Candlestick">;

  // lastUpdateTime keeps track of the last time the chart was updated.
  private lastUpdateTime: number = 0;

  // chart holds the reference to the chart instance.
  private chart: any;

  // currentBar holds the details for the current candlestick (open, high, low, close).
  private currentBar: {
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
  } = {
    open: null,
    high: null,
    low: null,
    close: null,
  };

  // Constructor initializes the chart, configures its settings, and adds a candlestick series.
  constructor(
    ref: any, // Reference to the DOM element where the chart will be rendered.
    initialData: any[], // Initial data to be plotted on the chart.
    layout: { background: string; color: string; text: string } // Layout configuration for background color and text color.
  ) {
    // Create a new chart with specified configuration.
    const chart = createLightWeightChart(ref, {
      autoSize: true, // Automatically resize chart based on its container.
      overlayPriceScales: {
        ticksVisible: false, // Display ticks (prices) on the overlay price scale.
        borderVisible: false, // Show border around the price scale.
      },
      crosshair: {
        mode: CrosshairMode.Normal, // Crosshair is enabled for normal mode interaction.
      },
      rightPriceScale: {
        visible: true, // Show the right price scale.
        ticksVisible: true, // Ensure price scale ticks are visible.
        entireTextOnly: true, // Display entire price label on the scale.
      },
      grid: {
        horzLines: {
          visible: true,
        },
        vertLines: {
          visible: true,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid, // Set background to a solid color.
          color: layout.background, // Use the passed background color from layout argument.
        },
        textColor: layout.text, // Set the text color for chart elements.
      },
    });

    // Store the chart instance in the class.
    this.chart = chart;

    // Add a candlestick series to the chart.
    this.candleSeries = chart.addCandlestickSeries();

    // Set the initial data for the candlestick series, converting timestamps to UTCTimestamps.
    this.candleSeries.setData(
      initialData.map((data) => ({
        ...data,
        time: (data.timestamp / 1000) as UTCTimestamp, // Convert timestamp to seconds for chart compatibility.
      }))
    );
  }

  // Method to update the chart with new price data.
  public update(updatedPrice: any) {
    // If this is the first update, set the lastUpdateTime to the current time.
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = new Date().getTime();
    }

    // Update the candle series with new price data for the current time.
    this.candleSeries.update({
      time: (this.lastUpdateTime / 1000) as UTCTimestamp, // Convert lastUpdateTime to seconds.
      close: updatedPrice.close, // Set the new close price.
      low: updatedPrice.low, // Set the new low price.
      high: updatedPrice.high, // Set the new high price.
      open: updatedPrice.open, // Set the new open price.
    });

    // If a new candle is initiated (i.e., new time interval started), update the lastUpdateTime.
    if (updatedPrice.newCandleInitiated) {
      this.lastUpdateTime = updatedPrice.time;
    }
  }

  // Method to destroy the chart and clean up resources.
  public destroy() {
    this.chart.remove(); // Remove the chart from the DOM.
  }
}

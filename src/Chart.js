
import React from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { StraightLine } from "react-stockcharts/lib/series";
import { EdgeIndicator } from "react-stockcharts/lib/coordinates";
import { ChartCanvas, Chart, ZoomButtons } from "react-stockcharts";
import { BarSeries, CandlestickSeries,BollingerSeries } from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } from "react-stockcharts/lib/coordinates";
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import { OHLCTooltip } from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { getData } from "./utils";
import { ema, sma, bollingerBand } from "react-stockcharts/lib/indicator";
import { saveInteractiveNodes, getInteractiveNodes } from "./interactiveutils";
import { last, toObject } from "react-stockcharts/lib/utils";
import { DrawingObjectSelector, FibonacciRetracement } from "react-stockcharts/lib/interactive";
import "./chartStyles.css";
import { faExpand } from "@fortawesome/free-solid-svg-icons";
import winSound from "./assets/win.mp3"
import lossSound from "./assets/loss.mp3";
import { AreaSeries } from "react-stockcharts/lib/series";
import ColorPicker from './ColorPicker';
import { TrendLine } from "react-stockcharts/lib/interactive";


class CandleStickChartWithZoomPan extends React.Component {
  constructor(props) {
    super(props);
    this.saveNode = this.saveNode.bind(this);
    this.resetYDomain = this.resetYDomain.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleMoveRight = this.handleMoveRight.bind(this);
    this.handleMoveLeft = this.handleMoveLeft.bind(this);
    this.handleBuyButtonHover = this.handleBuyButtonHover.bind(this);
    this.handleSellButtonHover = this.handleSellButtonHover.bind(this);
    this.handleButtonHoverEnd = this.handleButtonHoverEnd.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleBuyRequest = this.handleBuyRequest.bind(this);
    this.handleSellRequest = this.handleSellRequest.bind(this);
    this.handleCandleClose = this.handleCandleClose.bind(this);
    this.updateClosingPrice = this.updateClosingPrice.bind(this);
    this.toggleBollingerBands = this.toggleBollingerBands.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
    this.handleSaldoRefil = this.handleSaldoRefil.bind(this);
    this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
    this.getInteractiveNodes = getInteractiveNodes.bind(this);
    this.saveCanvasNode = this.saveCanvasNode.bind(this);
    this.toggleFibonacci = this.toggleFibonacci.bind(this);
    this.removeFibonacci = this.removeFibonacci.bind(this);
    this.onFibComplete1 = this.onFibComplete1.bind(this);
    this.toggleTrendLine = this.toggleTrendLine.bind(this);
    this.onTrendComplete1 = this.onTrendComplete1.bind(this);
    this.removeTrendLine = this.removeTrendLine.bind(this);
    this.duplicateDrawing = this.duplicateDrawing.bind(this);

    this.state = {
      suffix: 1,
      linePosition: this.props.data.length,
      horizontalLineColor: "#FFFFFF", // Cor inicial da linha horizontal
      showArrowUp: false, // Flag para mostrar a seta verde
      showArrowDown: false, // Flag para mostrar a seta vermelha
      quoteHistory: [],
      closingPrices: {},
      actionType: null,
      saldo: 10000, // Saldo inicial
      valorOperacao: 1, // Valor da operação definido pelo usuário
      countdownTimers: {},
      showBollingerBands: true,
      arrowPosition: 0,
      chartType: "candlestick",
      saldoRefil: false,
      closingTime: 10000,
      isWinSoundLoaded: false,
      isLossSoundLoaded: false,
      bollingerPeriod: 20,
      bollingerDeviation: 2,
      showBarSeries: true,
      showOptions: false,
      enableFib: false,
      retracements_1: [],
      fibSelected: false,
      selectedFibIndex: null,
      fibColor: '#3d83b5',
      bollingerBandsSettings: {top: "#f00000", middle: "#FFA500", bottom: "#FFFF00",},
      
      enableTrend: false,
      trendSelected: false,
      selectedTrendIndex: null,
      colorPickerOpen: false,
      fibColorPickerOpen: false,
      trendLineThickness: 1,

      fibLineThickness: 2,
      trends_1: [
        {
          start: [1606, 56],
          end: [1711, 53],
          appearance: { stroke: "green" },
          type: "XLINE"
        }
      ],
      trends_3: [],
      currentDateTime: new Date().toLocaleString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      })
    };
  }


  changeFibColor() {
    const { fibSelected, retracements_1, selectedFibIndex } = this.state;
  
    if (fibSelected && selectedFibIndex !== null) {
      const updatedRetracements = [...retracements_1];
      updatedRetracements[selectedFibIndex].appearance.stroke = this.state.fibColor;
  
      this.setState({
        retracements_1: updatedRetracements,
      });
    }
  }
  
  increaseFibLineThickness() {
    const { fibSelected, retracements_1, selectedFibIndex, fibLineThickness } = this.state;
  
    if (fibSelected && selectedFibIndex !== null) {
      const updatedRetracements = [...retracements_1];
      updatedRetracements[selectedFibIndex].appearance.strokeWidth = fibLineThickness + 1;
  
      this.setState({
        retracements_1: updatedRetracements,
        fibLineThickness: fibLineThickness + 1,
      });
    }
  }
  
  decreaseFibLineThickness() {
    const { fibSelected, retracements_1, selectedFibIndex, fibLineThickness } = this.state;
  
    if (fibSelected && selectedFibIndex !== null && fibLineThickness > 1) {
      const updatedRetracements = [...retracements_1];
      updatedRetracements[selectedFibIndex].appearance.strokeWidth = fibLineThickness - 1;
  
      this.setState({
        retracements_1: updatedRetracements,
        fibLineThickness: fibLineThickness - 1,
      });
    }
  }

  decreaseTrendlineThickness = () => {
    const { trendSelected, trends_1, selectedTrendIndex, trendLineThickness } = this.state;
  
    if (trendSelected && selectedTrendIndex !== null && trendLineThickness > 1) { // Add this condition to make sure the thickness is greater than 1
      // Cria uma cópia das tendências para evitar a mutação direta do estado
      const updatedTrends = [...trends_1];
  
      // Diminui a espessura da linha de tendência selecionada
      updatedTrends[selectedTrendIndex] = {
        ...updatedTrends[selectedTrendIndex],
        strokeWidth: trendLineThickness - 1
      };
  
      this.setState({
        trends_1: updatedTrends,
        trendLineThickness: trendLineThickness - 1
      });
    }
  };
  

  increaseTrendlineThickness = () => {
    const { trendSelected, trends_1, selectedTrendIndex, trendLineThickness } = this.state;
  
    if (trendSelected && selectedTrendIndex !== null) {
      // Cria uma cópia das tendências para evitar a mutação direta do estado
      const updatedTrends = [...trends_1];
  
      // Aumenta a espessura da linha de tendência selecionada
      updatedTrends[selectedTrendIndex] = {
        ...updatedTrends[selectedTrendIndex],
        strokeWidth: trendLineThickness + 1
      };
  
      this.setState({
        trends_1: updatedTrends,
        trendLineThickness: trendLineThickness + 1
      });
    }
  };


  handleKeyDown = (event) => {
    if (event.key === 'Delete') {
        const { fibSelected, trendSelected } = this.state;
        
        if (fibSelected) {
            this.removeFibonacci();
        } else if (trendSelected) {
            this.removeTrendLine();
        }
    }
}
  

  changeTrendColor() {
    const { trendSelected, trends_1, selectedTrendIndex } = this.state;

    if (trendSelected && selectedTrendIndex !== null) {
      // cria uma cópia das tendências para evitar a mutação direta do estado
      const updatedTrends = [...trends_1];
      // muda a cor da linha de tendência selecionada
      updatedTrends[selectedTrendIndex] = {
        ...updatedTrends[selectedTrendIndex],
        stroke: '#ff0000' // mude para a cor desejada
      };

      this.setState({
        trends_1: updatedTrends,
      });
    }
  }

  duplicateDrawing() {
    const { fibSelected, retracements_1, selectedFibIndex, trendSelected, trends_1, selectedTrendIndex } = this.state;
  
    if (fibSelected && selectedFibIndex !== null) {
      // cria uma cópia do Fibonacci selecionado
      const duplicateFib = JSON.parse(JSON.stringify(retracements_1[selectedFibIndex]));
      // altera a posição para a linha aparecer ao lado da original
      duplicateFib.x1 = duplicateFib.x1 + 10;
      duplicateFib.x2 = duplicateFib.x2 + 10;
      const updatedRetracements = [...retracements_1, duplicateFib];
  
      this.setState({
        retracements_1: updatedRetracements,
      });
    }
  
    if (trendSelected && selectedTrendIndex !== null) {
      // cria uma cópia da Trendline selecionada
      const duplicateTrend = JSON.parse(JSON.stringify(trends_1[selectedTrendIndex]));
      // altera a posição para a linha aparecer ao lado da original
      duplicateTrend.start[0] = duplicateTrend.start[0] + 10;
      duplicateTrend.start[1] = duplicateTrend.start[1] + 10;
      duplicateTrend.end[0] = duplicateTrend.end[0] + 10;
      duplicateTrend.end[1] = duplicateTrend.end[1] + 10;
      const updatedTrends = [...trends_1, duplicateTrend];
  
      this.setState({
        trends_1: updatedTrends,
      });
    }
  }
  
  




  saveCanvasNode(node) {
    this.canvasNode = node;
  }

  handleSelection(interactives) {
    const newState = toObject(interactives, each => {
      return [
        each.type === "FibonacciRetracement" ? `retracements_${each.chartId}` : `trends_${each.chartId}`,
        each.objects,
      ];
    });
  
    this.setState((prevState) => {
      const fibs = newState[`retracements_1`] || [];
      const selectedFibIndex = fibs.findIndex(fib => fib.selected);
  
      const trends = newState[`trends_1`] || [];
      const selectedTrendIndex = trends.findIndex(trend => trend.selected);
  
      if (selectedFibIndex < 0 && selectedTrendIndex < 0) {
        const newFibs = fibs.map(fib => ({ ...fib, selected: false }));
        const newTrends = trends.map(trend => ({ ...trend, selected: false }));
        return {
          ...prevState,
          retracements_1: newFibs,
          trends_1: newTrends,
          fibSelected: false,
          selectedFibIndex: null,
          trendSelected: false,
          selectedTrendIndex: null,
        };
      }
  
      return {
        ...newState,
        fibSelected: selectedFibIndex >= 0,
        selectedFibIndex: selectedFibIndex >= 0 ? selectedFibIndex : null,
        trendSelected: selectedTrendIndex >= 0,
        selectedTrendIndex: selectedTrendIndex >= 0 ? selectedTrendIndex : null,
      };
    });
  }
  
  

  onTrendComplete1(trends_1) {
    const trends = trends_1.map((trend) => ({ ...trend, selected: false }));
    this.setState({
      trends_1: trends,
      enableTrend: false,
      trendSelected: false,
      selectedTrendIndex: null,
    });
  }

  toggleTrendLine() {
    this.setState({
      enableTrend: !this.state.enableTrend,
      trendSelected: false,
      selectedTrendIndex: null,
      mode: !this.state.enableTrend ? 'trend' : 'normal',  // Update this
    });
  }

onFibComplete1(retracements_1) {
  const retracements = retracements_1.map(fib => ({ ...fib, selected: false }));
  this.setState({
    retracements_1: retracements,
    enableFib: false,
    fibSelected: false,
    selectedFibIndex: null
  });
}

 toggleFibonacci() {
    this.setState({
      enableFib: !this.state.enableFib,
      fibSelected: false,
      selectedFibIndex: null,
      mode: !this.state.enableFib ? 'fib' : 'normal',  // Update this
    });
  }


  removeFibonacci() {
    const { fibSelected, retracements_1, selectedFibIndex } = this.state;
  
    if (fibSelected && selectedFibIndex !== null) {
      const updatedRetracements = [...retracements_1];
      updatedRetracements.splice(selectedFibIndex, 1);
  
      this.setState({
        retracements_1: updatedRetracements,
        fibSelected: false,
        selectedFibIndex: null
      });
    }
  }

  removeTrendLine() {
    const { trendSelected, trends_1, selectedTrendIndex } = this.state;
  
    if (trendSelected && selectedTrendIndex !== null) {
      const updatedTrends = [...trends_1];
      updatedTrends.splice(selectedTrendIndex, 1);
  
      this.setState({
        trends_1: updatedTrends,
        trendSelected: false,
        selectedTrendIndex: null
      });
    }
  }

  loadSounds() {
    const winAudio = new Audio(winSound);
    const lossAudio = new Audio(lossSound);
  
    winAudio.addEventListener("canplaythrough", () => {
      this.setState({ isWinSoundLoaded: true });
    });
  
    lossAudio.addEventListener("canplaythrough", () => {
      this.setState({ isLossSoundLoaded: true });
    });
  }
  
  playWinSound() {
    const winAudio = new Audio(winSound);
    winAudio.play();
  }
  
  playLossSound() {
    const lossAudio = new Audio(lossSound);
    lossAudio.play();
  }

  handleOptionsClick() {
    this.setState(prevState => ({
      showOptions: !prevState.showOptions,
    }));
  }

  handleFullscreenButtonClick() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  updateCurrentDateTime() {
    this.setState({
      currentDateTime: new Date().toLocaleString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      })
    });
  }

  toggleChartType = () => {
    this.setState(prevState => ({
      chartType: prevState.chartType === "candlestick" ? "line" : "candlestick",
    }));
  }

  toggleBollingerBands() {
    this.setState(prevState => ({
      showBollingerBands: !prevState.showBollingerBands,
    }));
  }

  toggleBarSeries() {
    this.setState(prevState => ({
      showBarSeries: !prevState.showBarSeries,
    }));
  }

  saveNode(node) {
    this.node = node;
  }

  resetYDomain() {
    this.node.resetYDomain();
  }

  handleSaldoRefil() {
    if (this.state.saldo < 10000) {
      this.setState({
        saldo: 10000,
        saldoRefil: true,
      });
    }
  }

  handleTimeChange = (event) => {
    this.setState({
      closingTime: Number(event.target.value),
    });
  }
  
  handleBollingerBandsSettings = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      bollingerBandsSettings: {
        ...prevState.bollingerBandsSettings,
        [name]: value,
      },
    }));
  };

  handleReset() {
    this.setState({
      suffix: this.state.suffix + 1,
    });
  }

  handleMoveRight() {
    this.setState(prevState => ({
      linePosition: prevState.linePosition + 1,
    }));
  }

  handleMoveLeft() {
    this.setState(prevState => ({
      linePosition: prevState.linePosition - 1,
    }));
  }

  handleBuyButtonHover() {
    this.setState({
      horizontalLineColor: "#009900",
      showArrowUp: true,
      arrowPosition: (window.innerHeight - 50) / 2, // metade da altura do gráfico
    });
  }

  handleSellButtonHover() {
    this.setState({
      horizontalLineColor: "#FF0000",
      showArrowDown: true,
      arrowPosition: (window.innerHeight - 100) / 2, // metade da altura do gráfico
    });
  }

  handleButtonHoverEnd() {
    this.setState({
      horizontalLineColor: "#FFFFFF", // Reseta a cor da linha horizontal para vermelho
      showArrowUp: false, // Esconde a seta verde
      showArrowDown: false, // Esconde a seta vermelha
    });
  }

  handleValueChange(event) {
    this.setState({
      valorOperacao: Number(event.target.value),
    });
  }

  handleCandleClose(clickNumber) {
    const { data } = this.props;
    const lastCandle = data[data.length - 1];
  
    this.setState((prevState) => {
      const quoteIndex = prevState.quoteHistory.findIndex(
        (quote) => quote.clickNumber === clickNumber
      );
      if (
        quoteIndex !== -1 &&
        prevState.quoteHistory[quoteIndex].price === null
      ) {
        const updatedQuote = {
          ...prevState.quoteHistory[quoteIndex],
          price: lastCandle.close,
        };
        return {
          quoteHistory: [
            ...prevState.quoteHistory.slice(0, quoteIndex),
            updatedQuote,
            ...prevState.quoteHistory.slice(quoteIndex + 1),
          ],
        };
      }
      return null;
    });
  }

  updateClosingPrice(clickNumber) {
    const { data } = this.props;
    const lastCandle = data[data.length - 1];
  
    this.setState((prevState) => {
      const { closingPrices } = prevState;
      const updatedClosingPrices = { ...closingPrices };
      const closingPrice = lastCandle.close;
  
      if (
        closingPrices[clickNumber] &&
        closingPrices[clickNumber].price === null
      ) {
        updatedClosingPrices[clickNumber].price = closingPrice;
        updatedClosingPrices[clickNumber].timeLeft--;
        clearInterval(updatedClosingPrices[clickNumber].timer);

        clearInterval(this.state.countdownTimers[clickNumber].timerId);


        if (updatedClosingPrices[clickNumber].timeLeft > 0) {
          updatedClosingPrices[clickNumber].timeLeft--;
        } else {
          updatedClosingPrices[clickNumber].timeLeft = 0;
        }
  
        const quote = prevState.quoteHistory.find(
          (q) => q.clickNumber === clickNumber
        );
  
        if (quote.action === "COMPRA") {
          if (closingPrice > quote.price) {
              const valorOperacao = prevState.valorOperacao;
              const lucro = valorOperacao * 0.9;
              quote.result = "Win";
              this.playWinSound();
              return ({
                  saldo: prevState.saldo + valorOperacao + lucro,
              });
          } else {
              quote.result = "Loss";
              this.playLossSound();
          }
      } else if (quote.action === "VENDA") {
          if (closingPrice < quote.price) {
              const valorOperacao = prevState.valorOperacao;
              const lucro = valorOperacao * 0.9;
              quote.result = "Win";
              this.playWinSound();

              return ({
                  saldo: prevState.saldo + valorOperacao + lucro,
              });
          } else {
              quote.result = "Loss";
              this.playLossSound();

          }
      }
      }
  
      return {
        closingPrices: updatedClosingPrices,
      };
    });
  }

  handleBuyRequest() {
  
    const { data } = this.props;
    const currentPrice = last(data).close;
    const horizontalLineYValue = currentPrice; // Defina a posição vertical da linha horizontal
    const horizontalLineColor = "green"; // Defina a cor da linha horizontal
  
    this.setState({
      horizontalLineYValue,
      horizontalLineColor,
    });

    const currentQuote = {
      action: "COMPRA",
      clickNumber: this.state.quoteHistory.length + 1,
      date: new Date(),
      price: null,
      timeLeft: this.state.closingTime / 1000,
    };

    this.setState(prevState => ({
      actionType: "COMPRA",
      quoteHistory: [...prevState.quoteHistory, currentQuote],
      saldo: prevState.saldo - prevState.valorOperacao, // Abate o valor da operação do saldo total
    }));
    
    getData().then(data => {
      const updatedQuote = { ...currentQuote, price: data[data.length - 1].close };
      this.setState(prevState => ({
        quoteHistory: prevState.quoteHistory.map(quote =>
          quote.clickNumber === currentQuote.clickNumber ? updatedQuote : quote
        ),
      }), () => {
        const closingPriceTimer = setInterval(() => {
          this.updateClosingPrice(currentQuote.clickNumber);
        }, this.state.closingTime);
      
        this.setState(prevState => ({
          closingPrices: {
            ...prevState.closingPrices,
            [currentQuote.clickNumber]: {
              timer: closingPriceTimer,
              price: null,
            },
          },

          countdownTimers: {
            ...prevState.countdownTimers,
            [currentQuote.clickNumber]: {
              timeLeft: this.state.closingTime / 1000,
              timerId: setInterval(() => {
                this.setState(prevState => {
                  const currentCountdown = prevState.countdownTimers[currentQuote.clickNumber];
                  if (currentCountdown && currentCountdown.timeLeft > 0) {
                    return {
                      countdownTimers: {
                        ...prevState.countdownTimers,
                        [currentQuote.clickNumber]: {
                          ...currentCountdown,
                          timeLeft: currentCountdown.timeLeft - 1,
                        },
                      },
                    };
                  }
                  return null;
                });
              }, 1000),
            },
          },
        }));
      });
    });
  }

  handleSellRequest() {
    const currentQuote = {
      action: "VENDA",
      clickNumber: this.state.quoteHistory.length + 1,
      date: new Date(),
      price: null,
      timeLeft: this.state.closingTime / 1000,
        };

    this.setState(prevState => ({
      actionType: "VENDA",
      quoteHistory: [...prevState.quoteHistory, currentQuote],
      saldo: prevState.saldo - prevState.valorOperacao, // Abate o valor da operação do saldo total
    }));

    getData().then(data => {
      const updatedQuote = { ...currentQuote, price: data[data.length - 1].close };
      this.setState(prevState => ({
        quoteHistory: prevState.quoteHistory.map(quote =>
          quote.clickNumber === currentQuote.clickNumber ? updatedQuote : quote
        ),
      }), () => {
        const closingPriceTimer = setInterval(() => {
          this.updateClosingPrice(currentQuote.clickNumber);
        }, this.getClosingTime());
        this.setState(prevState => ({
          closingPrices: {
            ...prevState.closingPrices,
            [currentQuote.clickNumber]: {
              timer: closingPriceTimer,
              price: null,
            },
          },
        countdownTimers: {
            ...prevState.countdownTimers,
            [currentQuote.clickNumber]: {
              timeLeft: this.state.closingTime / 1000,
              timerId: setInterval(() => {
                this.setState(prevState => {
                  const currentCountdown = prevState.countdownTimers[currentQuote.clickNumber];
                  if (currentCountdown && currentCountdown.timeLeft > 0) {
                    return {
                      countdownTimers: {
                        ...prevState.countdownTimers,
                        [currentQuote.clickNumber]: {
                          ...currentCountdown,
                          timeLeft: currentCountdown.timeLeft - 1,
                        },
                      },
                    };
                  }
                  return null;
                });
              }, 1000),
            },
          },
        }));
      });
    });
  }

  componentDidMount() {
    this.closingPriceInterval = setInterval(() => {
      this.updateClosingPrice(this.state.quoteHistory.length + 1);
    }, this.state.closingTime);

    // Adicione o ouvinte de "keydown" para a função handleKeyDown
    document.addEventListener("keydown", this.handleKeyDown);
  
    // Iniciar intervalo para atualizar a hora atual a cada segundo
    this.currentDateTimeInterval = setInterval(() => {
      this.updateCurrentDateTime();
    }, 1000);
    this.loadSounds();
}

getClosingTime = () => this.state.closingTime;


componentWillUnmount() {
  clearInterval(this.closingPriceInterval);
  clearInterval(this.currentDateTimeInterval);
  document.removeEventListener("keydown", this.handleKeyDown);
}



  render() {
    const { type, data: initialData, ratio } = this.props;
    const { mouseMoveEvent, panEvent, zoomEvent, zoomAnchor } = this.props;
    const { clamp } = this.props;
    const ema20 = ema()
			.options({
				windowSize: 20, // optional will default to 10
				sourcePath: "close", // optional will default to close as the source
			})
			.skipUndefined(true) // defaults to true
			.merge((d, c) => {d.ema20 = c;}) // Required, if not provided, log a error
			.accessor(d => d.ema20) // Required, if not provided, log an error during calculation
			.stroke("orange"); // Optional
		const sma20 = sma()
			.options({ windowSize: 20 })
			.merge((d, c) => {d.sma20 = c;})
			.accessor(d => d.sma20);
		const bb = bollingerBand()
			.merge((d, c) => {d.bb = c;})
			.accessor(d => d.bb);
    const calculatedData = ema20(sma20(((bb(initialData)))));
    const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(d => d.date);
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);
    const start = xAccessor(last(data));
    const end = xAccessor(data[Math.max(0, data.length - 150)]);
    const xExtents = [start, end];
    const margin = { left: 0, right: 300, top: 20, bottom: 30 };
    const parentWidth = window.innerWidth - 0;
    const height = window.innerHeight - 0;
    const gridHeight = height - margin.top - margin.bottom;
    const gridWidth = parentWidth - margin.left - margin.right;
    const showGrid = true;
    const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStroke: "rgba(85,91,107, 1)", stroke: "rgba(65,71,87, 0)" } : {};
    const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStroke: "rgba(85,91,107, 1)", stroke: "rgba(65,71,87, 0)" } : {};

    const { enableFib, retracements_1, selectedFibIndex} = this.state;
    const { enableTrend, trends_1, selectedTrendIndex } = this.state;
    const { fibColorPickerOpen } = this.state;
    const style = {
      margin: "0px",
      position: "fixed",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#20283a"
    };
    const arrowUpStyle = this.state.showArrowUp
    ? {
        position: "absolute",
        top: `${this.state.arrowPosition}px`, // Posição vertical da seta
        left: "50%",
        transform: "translateX(-50%)",
        color: "#009900",
        fontSize: "40px",
      }
    : { display: "none" };
    const arrowDownStyle = this.state.showArrowDown
    ? {
        position: "absolute",
        bottom: `${this.state.arrowPosition}px`, // Posição vertical da seta
        left: "50%",
        transform: "translateX(-50%)",
        color: "#FF0000",
        fontSize: "40px",
      }
    : { display: "none" };
   


    return (
      
      <div style={style}>
       
         <button
          onClick={this.toggleFibonacci}
          style={{ position: "absolute", right: 80, top: 900, zIndex: 9999 }}
        >
          Desenhar Fibonacci
        </button>

    
        {selectedFibIndex !== null && (
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 100,
              backgroundColor: "null",
              padding: "5px 10px",
              borderRadius: 5,
              zIndex: 9999

            }}
          >
            <button onClick={this.removeFibonacci}>X</button>
            <button onClick={this.duplicateDrawing}>Duplicar</button>
            <button onClick={() => this.setState({ fibColorPickerOpen: !this.state.fibColorPickerOpen })}>Mudar Cor</button>
            <button onClick={this.increaseFibLineThickness.bind(this)}>Aumentar Espessura da Fibonacci</button>
            <button onClick={this.decreaseFibLineThickness.bind(this)}>Diminuir Espessura da Fibonacci</button>
            {fibColorPickerOpen && (
              <ColorPicker
                colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']}
                onChangeColor={(color) => {
                  const updatedRetracements = [...retracements_1];
                  updatedRetracements[selectedFibIndex].appearance.stroke = color;
                  this.setState({
                    retracements_1: updatedRetracements,
                    fibColorPickerOpen: false
                  });
                }}
              />
            )}
          </div>
        )}
        
  <button
  onClick={this.toggleTrendLine}
  style={{ position: "absolute", right: 80, top: 930, zIndex: 9999  }}
>
  Desenhar TrendLine
</button>
{selectedTrendIndex !== null && (
  <div
    style={{
      position: "absolute",
      left: 10,
      top: 100,
      backgroundColor: "null",
      padding: "5px 10px",
      borderRadius: 5,
      zIndex: 9999
    }}
  >
    <button onClick={this.removeTrendLine}>X</button>
    <button onClick={this.duplicateDrawing}>Duplicar</button>
    <button onClick={() => this.setState({ colorPickerOpen: !this.state.colorPickerOpen })}>Mudar Cor</button>
    <button onClick={this.increaseTrendlineThickness}>Aumentar espessura da linha</button>
    <button onClick={this.decreaseTrendlineThickness}>Diminuir espessura da linha</button>

    {this.state.colorPickerOpen && (
      <ColorPicker
        colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']}
        onChangeColor={(color) => {
          const updatedTrends = [...trends_1];
          updatedTrends[selectedTrendIndex].stroke = color;
          this.setState({
            trends_1: updatedTrends,
            colorPickerOpen: false
          });
        }}
      />
    )}
  </div>
)}

        <div style={{ display: "flex", flexDirection: "row" }}>

         
   
          <ChartCanvas
            ref={this.saveNode}
            height={height}
            ratio={ratio}
            width={parentWidth}
            margin={{ left: 10, right: 400, top: 20, bottom: 30 }}
            mouseMoveEvent={mouseMoveEvent}
            panEvent={panEvent}
            zoomEvent={zoomEvent}
            clamp={clamp}
            zoomAnchor={zoomAnchor}
            type={type}
            seriesName={`MSFT_${this.state.suffix}`}
            data={data}
            xScale={xScale}
            xExtents={xExtents}
            xAccessor={d => xAccessor(d) + 0.5}
            displayXAccessor={displayXAccessor}
          >


<Chart id={1} yExtents={d => [d.high * 1.001, d.low * 0.999]}>
              <XAxis axisAt="bottom" orient="bottom" zoomEnabled={zoomEvent} {...xGrid} />
              <YAxis axisAt="right" orient="right" ticks={5} zoomEnabled={zoomEvent} {...yGrid}  />
              <MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />
              {this.state.chartType === "candlestick" ? (
            
            <CandlestickSeries
              className="custom-candlestick"
              fill={d => (d.close > d.open ? "rgba(44,220,64, 1)" : "rgba(300,50,30, 1)")}
              wickStroke={d => (d.close > d.open ? "rgba(44,220,64, 1)" : "rgba(300,50,30, 1)")}
              widthRatio={0.7}
              stroke="none"
            />

            
            ) : (
            
            <AreaSeries
              yAccessor={d => d.close}
              fill="rgba(135, 206, 250, 0.2)" // Azul claro com opacidade 0.2 para preencher a região abaixo da linha
              strokeWidth={2}
              stroke="rgba(135, 206, 250, 1)" // Azul claro para a linha
            />
            )}
  <TrendLine
  ref={this.saveInteractiveNodes("TrendLine", 1)}
  enabled={enableTrend}
  trends={trends_1.map(t => ({
    ...t,
    appearance: { stroke: t.stroke || '#3d83b5', strokeWidth: t.strokeWidth || 2 } // se a propriedade strokeWidth estiver presente, use-a, senão, use 1
  }))}
  onComplete={this.onTrendComplete1}
/>

   <FibonacciRetracement
  ref={this.saveInteractiveNodes("FibonacciRetracement", 1)}
  enabled={enableFib}
  retracements={retracements_1}
  onComplete={this.onFibComplete1}
  appearance={{
    stroke: this.state.fibColor,
    strokeWidth: this.state.fibLineThickness,
    strokeOpacity: 1,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 13,
    fontFill: "#FFFFFF",
    edgeStroke: "#000000",
    edgeFill: "#FFFFFF",
    nsEdgeFill: "#ffffff",
    edgeStrokeWidth: 1,
    r: 5,
  }}
/>

            <EdgeIndicator
              itemType="last"
              orient="right"
              edgeAt="right"
              yAccessor={d => d.close}
              fill={d => (d.close > d.open ? "#009900" : "#FF0000")}
              style={{ strokeWidth: 10 }}
            />

            <StraightLine
              type="vertical"
              xValue={this.state.linePosition + 0.5}
              yValue={last(data).close}
              x1Value={this.state.linePosition + 0.5}
              y1Value={last(data).close}
              stroke="rgba(220, 0, 0, 1)" // Defina o valor de opacidade desejado (neste caso, 0.5)
              strokeWidth={3}
              strokeDasharray="4"
            />

            <StraightLine
              yValue={last(data).close}
              strokeDasharray="ShortDot"
              stroke={this.state.horizontalLineColor}
              strokeWidth={3}
            />


            <StraightLine
              yValue={this.state.horizontalLineYValue}
              strokeDasharray="Solid"
              stroke={this.state.horizontalLineColor}
              strokeWidth={3}
            />

            {this.state.showBollingerBands && (
              <BollingerSeries
              yAccessor={d => d.bb}
              stroke={this.state.bollingerBandsSettings}
              fill="transparent"
              className="bollinger-series"
            />

            )}
				
					<CurrentCoordinate yAccessor={ema20.accessor()} fill={ema20.stroke()} />

            <OHLCTooltip
              origin={[0, 0]} // Coordenadas de origem do tooltip (ajuste conforme necessário)
              orient="bottomLeft" // Orientação do tooltip (bottomLeft para canto inferior esquerdo)
              // labelFormat={timeFormat("%Y-%m-%d")} // Formato da data exibida
              textFill="#cac9c9" // Altera a cor do texto para cinza
              fontSize={10} // Tamanho da fonte
              displayValues={{
                open: d => `Open: ${d}`,
                high: d => `High: ${d}`,
                low: d => `Low: ${d}`,
                close: d => `Close: ${d}`,
              }}
            />

              <ZoomButtons onReset={this.handleReset} />
              
           
            </Chart>

            <Chart
              id={2}
              yExtents={d => d.volume}
              height={150}
              origin={(w, h) => [0, h - 150]}
            >
            
              <MouseCoordinateX
                at="bottom"
                orient="bottom"
                displayFormat={timeFormat("%Y.%m.%d %H:%M")}
              />

              <MouseCoordinateY
                at="right"
                orient="right"
                displayFormat={format(".2f")}
              />

            

            {this.state.showBarSeries && (
                          
            <BarSeries
              yAccessor={d => d.volume}
              fill={d => (d.close > d.open ? "rgba(44,220,64, 0.2)" : "rgba(300,50,30, 0.2)")}
            />
            )}
            </Chart>
            
          
            <CrossHairCursor stroke="gray" />

            
            <DrawingObjectSelector
    enabled={!this.state.enableFib && !this.state.enableTrend}
    getInteractiveNodes={this.getInteractiveNodes}
    drawingObjectMap={{
        FibonacciRetracement: "retracements",
        TrendLine: "trends"
    }}
    onSelect={this.handleSelection}
/>

          </ChartCanvas>

          <div className="chart-history-container">
            <div className="buttons-container" style={{ marginTop: '20px', marginRight: '50px' }}>
              <div className="button-group"> 
              <div className="saldo-container">
            Saldo: R$ {this.state.saldo.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            })}
          </div>

          <button onClick={this.handleSaldoRefil} className="button-refil">
            Refil Saldo
          </button>

          <select
            onChange={this.handleTimeChange}
            className="select-menu"
          >
            <option value={10000}>10seg</option>
            <option value={60000}>1min</option>
            <option value={300000}>5min</option>
            <option value={900000}>15min</option>
          </select>

          <div className="button-group" style={{ marginTop: '10px', marginLeft: '50px' }}>
            <input
              type="number"
              min="1"
              value={this.state.valorOperacao}
              onChange={this.handleValueChange}
              className="chart-history-value-select"
            />
          </div>
                        
          <button
            onClick={this.handleMoveLeft}
            onMouseEnter={this.handleMinusButtonHover}
            onMouseLeave={this.handleButtonHoverEnd}
            className="button"
            style={{ zIndex: 100, marginTop: '20px' }}
          >
            -
          </button>

          <button
            onClick={this.handleMoveRight}
            onMouseEnter={this.handlePlusButtonHover}
            onMouseLeave={this.handleButtonHoverEnd}
            className="button"
            style={{ zIndex: 100 }}
          >
            +
          </button>
          </div>
          <div className="button-group">
            <button
              onClick={this.handleBuyRequest}
              onMouseEnter={this.handleBuyButtonHover}
              onMouseLeave={this.handleButtonHoverEnd}
              style={{ zIndex: 100, width: '100px', height: '80px' }}
              className="buy-button"
            >
              <strong>Comprar</strong>
            </button>
            
                <button
                  onClick={this.handleSellRequest}
                  onMouseEnter={this.handleSellButtonHover}
                  onMouseLeave={this.handleButtonHoverEnd}
                  style={{ zIndex: 100, width: '100px', height: '80px' }}
                  className="sell-button"
                >
                  <strong>Vender</strong>
                </button>
              </div>
    
              <FontAwesomeIcon
                icon={faArrowUp}
                style={{ zIndex: 100, ...arrowUpStyle }}
              />
              <FontAwesomeIcon
                icon={faArrowDown}
                style={{ zIndex: 100, ...arrowDownStyle }}
              />
            </div>

            <div className="chart-history-box" >
              <div className="chart-history-column">
                {this.state.quoteHistory.map(quote => (
                  <div key={quote.clickNumber} className="chart-history-item">
                    <div>
                      {quote.action} {quote.clickNumber} {quote.date.toLocaleDateString()}{" "}
                      {quote.date.toLocaleTimeString()} {quote.price}
                    </div>
                  </div>
                ))}
              </div>  
              <div className="chart-history-divider"></div>
              <div className="chart-history-column">
                {this.state.quoteHistory.map(quote => (
                  <div key={quote.clickNumber} className="chart-history-item">
                  <div>
                  {this.state.closingPrices[quote.clickNumber] &&
                  this.state.closingPrices[quote.clickNumber].price !== null
                  ? `Fechamento: ${this.state.closingPrices[quote.clickNumber].price}`
                  : this.state.countdownTimers[quote.clickNumber] // Verifique se existe
                    ? `Aguardando Fechamento (${this.state.countdownTimers[quote.clickNumber].timeLeft}s)` 
                    : 'Aguardando Fechamento'}
              </div>
              <div>
              {quote.price !== null && this.state.closingPrices[quote.clickNumber] && this.state.closingPrices[quote.clickNumber].price !== null
                ? (
                  <span style={{ color: quote.result === 'Win' ? 'green' : 'red', fontWeight: 'bold' }}>
                    {quote.result}
                  </span>
                  )
                  : 'N/A'
                }
              </div>
            </div>
          ))}
        </div>
      </div>
            
            <button onClick={() => this.toggleBollingerBands()} className="button-toggle">
              {this.state.showBollingerBands ? "Esconder BB" : "Mostrar BB"}
            </button>

            <button onClick={() => this.toggleBarSeries()} className="button-toggle">
              {this.state.showBarSeries ? "Esconder Volume" : "Mostrar Volume"}
            </button>

            <button onClick={() => this.handleOptionsClick()} className="button-options">Config Bandas
            </button>

          {this.state.showOptions && (
            <div className="options-window">
              <div>
                <label htmlFor="bbTop">Cor do Topo:</label>
                <input
                  type="color"
                  id="bbTop"
                  name="top"
                  value={this.state.bollingerBandsSettings.top}
                  onChange={this.handleBollingerBandsSettings}
                />
              </div>

              <div>
                <label htmlFor="bbMiddle">Cor do Meio:</label>
                <input
                  type="color"
                  id="bbMiddle"
                  name="middle"
                  value={this.state.bollingerBandsSettings.middle}
                  onChange={this.handleBollingerBandsSettings}
                />
              </div>

              <div>
                <label htmlFor="bbBottom">Cor da Base:</label>
                <input
                  type="color"
                  id="bbBottom"
                  name="bottom"
                  value={this.state.bollingerBandsSettings.bottom}
                  onChange={this.handleBollingerBandsSettings}
                />
              </div>
              <button onClick={() => this.handleOptionsClick()} className="button-options">Fechar</button>
            </div>
          )}

            <button onClick={this.toggleChartType} className="button-switch">
              {this.state.chartType === "candlestick" ? "Gráfico de Linha" : "Gráfico de Candles"}
            </button>




            <div className="current-date-time" style={{ color: 'white', marginRight: '70px' }}>{this.state.currentDateTime}
            </div>

            <div className="fullscreen-button" onClick={this.handleFullscreenButtonClick}>
              <FontAwesomeIcon icon={faExpand} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CandleStickChartWithZoomPan.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
  price: PropTypes.number,
  onClick: PropTypes.func,
};

CandleStickChartWithZoomPan.defaultProps = {
  type: "svg",
};

CandleStickChartWithZoomPan = fitWidth(CandleStickChartWithZoomPan);

export default CandleStickChartWithZoomPan;
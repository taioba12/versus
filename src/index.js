import React from 'react';
import { render } from 'react-dom';
import Chart from './Chart';
import { getData } from "./utils"

import bitcoinLogo from "./assets/logo-bitcoin.png";
import ethereumLogo from "./assets/logo-ethereum.png";
import litecoinLogo from "./assets/logo-litecoin.png";

class ChartComponent extends React.Component {
    state = {
        timeframe: "1m",
        data: null,
        asset: "Bitcoin",
        symbol: "BTCUSDT",
        activeAsset: {
            name: "Bitcoin",
            logo: bitcoinLogo
        }
    };

    componentDidMount() {
        this.fetchData(this.state.timeframe, this.state.symbol)
            .then(() => {
                this.interval = setInterval(() => this.fetchData(this.state.timeframe, this.state.symbol), 1000);
            });
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    fetchData = (timeframe, symbol) => {
        return getData(timeframe, symbol).then(data => {
          this.setState({ data });
        });
      };

      handleTimeframeChange = event => {
        this.setState({ timeframe: event.target.value });
        this.fetchData(event.target.value, this.state.symbol);
      };

    handleAssetChange = (event) => {
        const asset = event.target.value;
        let symbol = "";
        let activeAsset = {};
        const timeframe = this.state.timeframe;

        if (asset === "Bitcoin") {
            symbol = "BTCUSDT";
            activeAsset = {
                name: "Bitcoin",
                logo: bitcoinLogo
            };
        } else if (asset === "Ethereum") {
            symbol = "ETHUSDT";
            activeAsset = {
                name: "Ethereum",
                logo: ethereumLogo
            };
        } else if (asset === "Litecoin") {
            symbol = "LTCUSDT";
            activeAsset = {
                name: "Litecoin",
                logo: litecoinLogo
            };
        }

        this.setState({ asset, symbol, activeAsset });
        this.fetchData(timeframe, symbol);
    };

    render() {
        if (this.state.data == null) {
            return <div>Loading...</div>;
        }

        const { activeAsset } = this.state;

        return (
            <div>
                <div style={{ position: "absolute", top: 30, left: 0, margin: "30px", zIndex: 100 }}>
                    <select
                        value={this.state.asset}
                        onChange={this.handleAssetChange}
                        style={{
                            padding: "10px",
                            fontSize: "10px",
                            borderRadius: "5px",
                            backgroundColor: "#f5f5f5",
                            color: "#333333",
                            border: "1px solid #000000",
                            cursor: "pointer",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
                        }}
                    >
                        <option value="Bitcoin">Bitcoin</option>
                        <option value="Ethereum">Ethereum</option>
                        <option value="Litecoin">Litecoin</option>
                    </select>
                    <select
                        value={this.state.timeframe}
                        onChange={this.handleTimeframeChange}
                        style={{
                            marginLeft: "10px",
                            padding: "10px",
                            fontSize: "10px",
                            borderRadius: "5px",
                            backgroundColor: "#f5f5f5",
                            color: "#333333",
                            border: "1px solid #000000",
                            cursor: "pointer",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
                        }}
                    >
                        <option value="1m">1 Minuto</option>
                        <option value="5m">5 Minutos</option>
                        <option value="15m">15 Minutos</option>
                        <option value="1h">1 Hora</option>
                        <option value="1d">1 Dia</option>
                    </select>
                </div> 
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "0px", zIndex: 9999  }}>
                    <img src={activeAsset.logo} alt={activeAsset.name} width="60" style={{ zIndex: 9999 }} />
                    <h1 style={{ marginLeft: "0px", zIndex: 9999, color: "white" }}>{activeAsset.name}</h1>
                </div>
              
                <Chart type="hybrid" data={this.state.data} />
            </div>
        )
    }
}

render(
    <ChartComponent />,
    document.getElementById("root")
);
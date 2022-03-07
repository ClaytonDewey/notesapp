import logo from "./logo.svg";
import "./App.css";

import React, { useEffect, useReducer } from "react";
import { API } from "aws-amplify";
import { List } from "antd";
import "antd/dist/antd.css";
import { listNotes } from "./graphql/queries";

const App = () => {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
                    Learn React
                </a>
            </header>
        </div>
    );
};

export default App;

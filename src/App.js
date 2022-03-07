import logo from "./logo.svg";
import "./App.css";

import React, { useEffect, useReducer } from "react";
import { API } from "aws-amplify";
import { List } from "antd";
import "antd/dist/antd.css";
import { listNotes } from "./graphql/queries";

const initialState = {
    notes: [],
    loading: true,
    error: false,
    form: { name: "", description: "" },
};

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_NOTES":
            return { ...state, notes: action.notes, loading: false };
        case "ERROR":
            return { ...state, loading: false, error: true };
        default:
            return {
                ...state,
            };
    }
};

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const fetchNotes = async () => {
        try {
            const notesData = await API.graphql({
                query: listNotes,
            });
            dispatch({ type: "SET_NOTES", notes: notesData.data.listNotes.items });
        } catch (err) {
            console.error("error: ", err);
            dispatch({ type: "ERROR" });
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

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

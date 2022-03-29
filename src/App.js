import "./App.css";

import React, { useEffect, useReducer } from "react";
import { API } from "aws-amplify";
import { List, Input, Button } from "antd";
import { v4 as uuid } from "uuid";
import "antd/dist/antd.css";
import { listNotes } from "./graphql/queries";
import { createNote as CreateNote, deleteNote as DeleteNote, updateNote as UpdateNote } from "./graphql/mutations";
import { onCreateNote } from "./graphql/subscriptions";

const CLIENT_ID = uuid();

const initialState = {
    notes: [],
    loading: true,
    error: false,
    form: { name: "", description: "" },
};

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_NOTES":
            return {
                ...state,
                notes: action.notes,
                loading: false,
            };

        case "ERROR":
            return {
                ...state,
                loading: false,
                error: true,
            };

        case "ADD_NOTE":
            return {
                ...state,
                notes: [action.note, ...state.notes],
            };

        case "RESET_FORM":
            return {
                ...state,
                form: initialState.form,
            };

        case "SET_INPUT":
            return {
                ...state,
                form: { ...state.form, [action.name]: action.value },
            };

        case "ADD_EXCLAMATION":
            return {
                ...state,
                notes: state.notes.map((x) => ({
                    ...x,
                    name: x === action.item ? `${x.name}!` : x.name,
                })),
            };

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

            dispatch({
                type: "SET_NOTES",
                notes: notesData.data.listNotes.items,
            });
        } catch (err) {
            console.error("error: ", err);
            dispatch({ type: "ERROR" });
        }
    };

    useEffect(() => {
        fetchNotes();

        const subscription = API.graphql({
            query: onCreateNote,
        }).subscribe({
            next: (noteData) => {
                const note = noteData.value.data.onCreateNote;

                if (CLIENT_ID === note.clientId) return;
                dispatch({
                    type: "ADD_NOTE",
                    note: note,
                });
            },
        });

        // Pass a clean-up function to React
        return () => subscription.unsubscribe();
    }, []);

    const createNote = async () => {
        const { form } = state;
        if (!form.name || !form.description) {
            return alert("please enter a name and description");
        }

        const note = {
            ...form,
            clientId: CLIENT_ID,
            completed: false,
            id: uuid(),
        };

        dispatch({
            type: "ADD_NOTE",
            note: note,
        });

        dispatch({
            type: "RESET_FORM",
        });

        try {
            await API.graphql({
                query: CreateNote,
                variables: { input: note },
            });
        } catch (err) {
            console.error("error: ", err);
        }
    };

    const deleteNote = async (noteToDelete) => {
        // Optimistically update state and screen
        dispatch({
            type: "SET_NOTES",
            notes: state.notes.filter((x) => x !== noteToDelete),
        });

        // Then do the delete via GraphQL mutation.
        try {
            await API.graphql({
                query: DeleteNote,
                variables: {
                    input: {
                        id: noteToDelete.id,
                    },
                },
            });
        } catch (err) {
            console.error({ err });
        }
    };

    const updateNote = async (noteToUpdate) => {
        // Update the state and display optimistically.
        dispatch({
            type: "SET_NOTES",
            notes: state.notes.map((x) => ({
                ...x,
                completed: x === noteToUpdate ? !x.completed : x.completed,
            })),
        });

        // Then call the backend.
        try {
            await API.graphql({
                query: UpdateNote,
                variables: {
                    input: {
                        id: noteToUpdate.id,
                        completed: !noteToUpdate.completed,
                    },
                },
            });
        } catch (err) {
            console.error({ err });
        }
    };

    const addExclamation = (item) => {
        dispatch({
            type: "ADD_EXCLAMATION",
            item: item,
        });
    };

    const onChange = (e) => {
        dispatch({
            type: "SET_INPUT",
            name: e.target.name,
            value: e.target.value,
        });
    };

    function renderItem(item) {
        return (
            <List.Item
                style={styles.item}
                actions={[
                    <p style={styles.p} onClick={() => deleteNote(item)}>
                        {" "}
                        Delete
                    </p>,
                    <p style={styles.p} onClick={() => updateNote(item)}>
                        {item.completed ? "Mark incomplete" : "Mark complete"}
                    </p>,
                    <p style={styles.p} onClick={() => addExclamation(item)}>
                        + !
                    </p>,
                ]}
            >
                <List.Item.Meta
                    title={`${item.name}${item.completed ? " (completed)" : ""}`}
                    description={item.description}
                />
            </List.Item>
        );
    }

    return (
        <div style={styles.container}>
            <Input
                onChange={onChange}
                value={state.form.name}
                placeholder="Enter Note Name"
                name="name"
                style={styles.input}
            />
            <Input
                onChange={onChange}
                value={state.form.description}
                placeholder="Enter Note description"
                name="description"
                style={styles.input}
            />
            <Button onClick={createNote} type="primary">
                Create Note
            </Button>
            <hr />
            <h4>
                {state.notes.filter((x) => x.completed).length} completed / {state.notes.length} total
            </h4>
            <hr />
            <List loading={state.loading} dataSource={state.notes} renderItem={renderItem} />
        </div>
    );
};

const styles = {
    container: { padding: 20 },
    input: { marginBottom: 10 },
    item: { textAlign: "left" },
    p: { color: "#1890ff", cursor: "pointer" },
};

export default App;

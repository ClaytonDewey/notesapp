import React, { useEffect, useReducer } from 'react';
import { API } from 'aws-amplify';
import { List } from 'antd';
import 'antd/dist/antd.css';
import { listNotes } from './graphql/queries';

const initialState = {
  notes: [],
  loading: true,
  error: false,
  forms: { name: '', description: '' },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.notes, loading: false };
    case 'ERROR':
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async () => {
    try {
      const notesData = await API.graphql({
        query: listNotes,
      });
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items });
    } catch (err) {
      console.error('error: ', err);
      dispatch({ type: 'ERROR' });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const styles = {
    container: { padding: 10 },
    input: { marginBottom: 10 },
    item: { textAlign: 'left' },
    p: { color: '#1890ff' },
  };

  const renderItem = (item) => {
    return (
      <List.Item style={styles.item}>
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    );
  };

  return (
    <div style={styles.container}>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
};

export default App;

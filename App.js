// App.js

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  // Load tasks from AsyncStorage when the app starts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks !== null) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (e) {
        console.error('Failed to load tasks.', e);
      }
    };
    loadTasks();
  }, []);

  // Save tasks to AsyncStorage whenever the tasks list changes
  useEffect(() => {
    const saveTasks = async () => {
      try {
        const jsonValue = JSON.stringify(tasks);
        await AsyncStorage.setItem('tasks', jsonValue);
      } catch (e) {
        console.error('Failed to save tasks.', e);
      }
    };
    saveTasks();
  }, [tasks]);

  // Effect for handling notification permissions and listeners
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);


  // Function to handle adding a new task
  const handleAddTask = async () => {
    if (task.trim() === '') {
      Alert.alert('Empty Task', 'Please enter a task before adding.');
      return;
    }

    const newTask = {
      id: Date.now().toString(), // Unique ID for the task
      text: task,
      completed: false,
      notificationId: null, // To store the notification identifier
    };

    // Schedule a notification for 10 seconds in the future
    const notificationId = await schedulePushNotification(newTask.text, 10);
    newTask.notificationId = notificationId;

    setTasks([...tasks, newTask]);
    setTask(''); // Clear the input field
    Keyboard.dismiss(); // Dismiss the keyboard
  };

  // Function to toggle the completion status of a task
  const toggleComplete = async (id) => {
    const updatedTasks = tasks.map(async (t) => {
      if (t.id === id) {
        const updatedTask = { ...t, completed: !t.completed };
        // If task is marked complete and has a notification, cancel it
        if (updatedTask.completed && updatedTask.notificationId) {
          await cancelScheduledNotification(updatedTask.notificationId);
          // We can clear the notificationId, but it's optional
          // updatedTask.notificationId = null;
        }
        return updatedTask;
      }
      return t;
    });

    const resolvedTasks = await Promise.all(updatedTasks);
    setTasks(resolvedTasks);
  };


  // Function to delete a task
  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);

    // Cancel the notification if it exists
    if (taskToDelete && taskToDelete.notificationId) {
      await cancelScheduledNotification(taskToDelete.notificationId);
    }

    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Render each task item in the FlatList
  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity style={styles.taskTextContainer} onPress={() => toggleComplete(item.id)}>
        <Text style={item.completed ? styles.taskTextCompleted : styles.taskText}>
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.taskList}
        ListEmptyComponent={<Text style={styles.emptyListText}>No tasks yet. Add one!</Text>}
      />
    </View>
  );
}

// --- Notification Helper Functions ---

async function schedulePushNotification(taskText, delayInSeconds) {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder!  reminder! 📬",
      body: `Time to complete: ${taskText}`,
      data: { task: taskText }, // Optional data payload
    },
    trigger: { seconds: delayInSeconds },
  });
  console.log('Scheduled notification with ID:', identifier);
  return identifier;
}

async function cancelScheduledNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Cancelled notification with ID:', identifier);
  } catch (e) {
    console.error(`Could not cancel notification ${identifier}:`, e);
  }
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId: https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}


// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 2,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 18,
    color: '#333',
  },
  taskTextCompleted: {
    fontSize: 18,
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});
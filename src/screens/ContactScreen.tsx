import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ContactScreen = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      const userId = auth().currentUser?.uid || 'anonymous';
      
      await firestore().collection('messages').add({
        userId,
        subject,
        message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'unread'
      });

      Alert.alert(
        'Success',
        'Your message has been sent! We will respond within 24 hours.',
        [{ text: 'OK' }]
      );

      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your message"
          placeholderTextColor="#666"
          multiline
          numberOfLines={6}
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
          disabled={!subject || !message}
        >
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Other Ways to Reach Us</Text>
        <Text style={styles.infoText}>Email: support@arcadeportal.com</Text>
        <Text style={styles.infoText}>Response Time: Within 24 hours</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b044e',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    marginVertical: 20,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ffd700',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#2b044e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  infoTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default ContactScreen;
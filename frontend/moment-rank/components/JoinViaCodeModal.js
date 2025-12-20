import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Style from '../Styles/main';

const JoinViaCodeModal = ({ visible, onClose, onJoin, loading }) => {
    const [code, setCode] = useState('');

    const handleJoin = () => {
        if (code.trim().length === 0) return;
        onJoin(code.trim().toUpperCase());
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ width: '100%', alignItems: 'center' }}
                >
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 25,
                        padding: 25,
                        width: '90%',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10
                    }}>
                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[Style.h2, { marginBottom: 0 }]}>Join with Code</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                                <Text style={{ fontSize: 28, fontWeight: '300', color: '#999' }}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>
                            Enter the 8-character invite code to join a private event.
                        </Text>

                        <TextInput
                            style={[Style.input, {
                                width: '100%',
                                textAlign: 'center',
                                fontSize: 24,
                                fontWeight: 'bold',
                                letterSpacing: 4,
                                backgroundColor: '#f9f9f9'
                            }]}
                            placeholder="XXXXXXXX"
                            placeholderTextColor="#ccc"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="characters"
                            maxLength={8}
                            autoFocus={true}
                        />

                        <TouchableOpacity
                            onPress={handleJoin}
                            disabled={loading || code.trim().length === 0}
                            style={{
                                marginTop: 25,
                                backgroundColor: loading || code.trim().length === 0 ? '#ccc' : '#FF9500',
                                paddingVertical: 15,
                                borderRadius: 25,
                                width: '100%',
                                alignItems: 'center'
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Join Event</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            style={{ marginTop: 15 }}
                        >
                            <Text style={{ color: '#666', fontSize: 14 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default JoinViaCodeModal;

import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import Style from '../Styles/main';

const QrInviteModal = ({ visible, onClose, qrData, loading }) => {
    if (!visible) return null;

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
                        <Text style={[Style.h2, { marginBottom: 0 }]}>Event QR Invite</Text>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <Text style={{ fontSize: 28, fontWeight: '300', color: '#999' }}>×</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={{ height: 300, justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color="#FF9500" />
                            <Text style={{ marginTop: 15, color: '#666' }}>Generating QR Code...</Text>
                        </View>
                    ) : qrData ? (
                        <>
                            <View style={{
                                backgroundColor: '#f9f9f9',
                                padding: 15,
                                borderRadius: 20,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: '#eee'
                            }}>
                                <Image
                                    source={{ uri: qrData.qrCodeUrl }}
                                    style={{ width: 250, height: 250 }}
                                    resizeMode="contain"
                                />
                            </View>

                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 }}>
                                {qrData.eventName}
                            </Text>

                            <View style={{
                                backgroundColor: '#FFF5BA',
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 10,
                                marginBottom: 20
                            }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9500', letterSpacing: 2 }}>
                                    {qrData.inviteCode}
                                </Text>
                            </View>

                            <Text style={{ textAlign: 'center', color: '#666', fontSize: 14, lineHeight: 20 }}>
                                Anyone with this QR code or invite code can join your event.
                            </Text>

                            <TouchableOpacity
                                onPress={onClose}
                                style={{
                                    marginTop: 25,
                                    backgroundColor: '#FF9500',
                                    paddingVertical: 12,
                                    paddingHorizontal: 40,
                                    borderRadius: 25,
                                    width: '100%',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={{ color: '#666' }}>Failed to load QR code. Please try again.</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default QrInviteModal;

import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";

// Extracted ContentCard component for reusability
const ContentCard = ({ imageSource, description, onPress }) => (
    <View style={styles.contentCard}>
        <Image
            source={imageSource}
            style={styles.stockImage}
            resizeMode="cover"
        />
        <View style={styles.descriptionLabelContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
        </View>
        <View style={styles.descriptionTextContainer}>
            <Text style={styles.descriptionText}>
                {description}
            </Text>
        </View>
        <View style={styles.openButtonContainer}>
            <TouchableOpacity onPress={onPress} style={styles.openButton} activeOpacity={0.7}>
                <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default function HomeScreen() {
    const handleOpen = (index) => {
        // Handle open action
        console.log(`Open button pressed for card ${index}`);
    };

    const cardData = [
        {
            id: 1,
            imageSource: require('../../assets/stock-photo.png'),
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's"
        },
        {
            id: 2,
            imageSource: require('../../assets/stock-photo.png'),
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's"
        },
        {
            id: 3,
            imageSource: require('../../assets/stock-photo.png'),
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's"
        }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.backgroundWhiteBox}>
                <AppHeader />
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                >
                    {cardData.map((card) => (
                        <ContentCard
                            key={card.id}
                            imageSource={card.imageSource}
                            description={card.description}
                            onPress={() => handleOpen(card.id)}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>

    );
    
}



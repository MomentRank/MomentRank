import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
    const router = useRouter();
    
    const handleOpen = (cardId) => {
        // Navigate to PhotoUploadScreen with the card ID as eventId
        router.push({
            pathname: '/photo-upload',
            params: { eventId: cardId.toString() }
        });
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
        },
        {
            id: 4,
            imageSource: require('../../assets/stock-photo.png'),
            description: "Lorem ipsum dolor sit amet, quodsi quaeque sit et, ut eros interesset pri. Primis labores repudiare nam id, at eum facete delectus contentiones. Ne lobortis aliquando per. Eum saperet mediocritatem no, sea admodum signiferumque ut, an utamur dolorum adversarium pro. Per ad mazim consulatu complectitur, elit mazim et nec."
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



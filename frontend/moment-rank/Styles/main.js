import { Button, StyleSheet } from "react-native"

export default StyleSheet.create({
  container: {
    backgroundColor: "#ffffffff",
    padding: 0,
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: '5%',
  },
  containerTitle: {
    alignSelf: "center",
    justifyContent: "center",
    marginTop: '10%',
    marginBottom: '6%',
    flex: 0,
  },
  containerHor: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    flex: 0.4,
    marginHorizontal: '5%',
  },
  signinContainer: {
    marginTop: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    width: "100%",
    alignSelf: "center",
    fontFamily: "Roboto_400Regular",
    backgroundColor: "rgba(60, 60, 67, 0.15)",
    color: "#000000",
  },
  h2: {
    color: "#4C4C4C",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "Roboto_400Regular",

    alignSelf: "center",
    justifyContent: "center",
    display: "flex",
  },
  title: {
    fontSize: 44,
    letterSpacing: 3,
    fontFamily: "JacquesFrancoisShadow_400Regular",
    color: "#4C4C4C",
  },
  buttonBig: {
    backgroundColor: "#FF9500",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonBigText: {
    color: '#333',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 20,
    fontFamily: "Roboto_400Regular",
  },

  buttonAuth: {
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    flexDirection: "row",
  },
  buttonSmall: {
    textAlign: "right",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  buttonSmallText: {
    color: "#FF9500",
    fontSize: 15,
    fontFamily: "Roboto_400Regular",
  },
  buttonAuthText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Roboto_400Regular",
  },
  logoImage: {
    width: 30,
    height: 30,
    marginHorizontal: 15,
  },
  lineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    marginBottom: 30,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.5,
    backgroundColor: "#000",
  },
  lineText: {
    marginHorizontal: 10,
    fontSize: 20,
    color: "#333",
    fontFamily: "Roboto_400Regular",
  },
  buttonCreate: {
    textAlign: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonCreateText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Roboto_400Regular",
  },
  buttonInfo: {

  },
  buttonInfoText: {
    textAlign: "center",
    fontFamily: "Roboto_400Regular",
  },
  text: {
    fontFamily: "Roboto_400Regular",
    fontSize: 15,
    marginBottom: 7,
  },
  passwordRequirements: {
    marginTop: 10,
    marginBottom: 20,
  },
  requirementText: {
    fontFamily: "Roboto_700Bold",
    fontSize: 14,
    color: "#000000",
    marginBottom: 3,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "#FFD280",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  backgroundWhiteBox: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginBottom: '20%'
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#000000",
  },
  stockImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
  },
  descriptionLabelContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  descriptionLabel: {
    fontFamily: "Roboto_400Regular",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  descriptionTextContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  descriptionText: {
    fontFamily: "Roboto_400Regular",
    fontSize: 15,
    color: "#000000",
    lineHeight: 22,
  },
  openButtonContainer: {
    paddingBottom: 20,
  },
  openButton: {
    backgroundColor: "#FF9500",
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  openButtonText: {
    color: "#FFFFFF",
    fontFamily: "Roboto_400Regular",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomNavigation: {
    borderTopWidth: 2,
    borderTopColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: '4%',
    paddingBottom: '5%',
    paddingHorizontal: '12%',
    marginHorizontal: '-2%',
  },
  navIcon: {
    fontSize: 32,
  },
  validRequirement: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  invalidRequirement: {
    color: "#F44336",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },
  sectionLine: {
    height: 1,
    backgroundColor: "#ccc",
    marginBottom: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginVertical: 10,
  },

});
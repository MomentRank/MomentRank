import {Button, StyleSheet} from "react-native"

export default StyleSheet.create({
  container: {
    backgroundColor: "#EEEEEE",
    padding: 20,
    justifyContent: 'center',
    flex:1,
  },
  containerTitle: {
    alignSelf: "center",
    justifyContent: "flex-end",
    marginTop: 50,
    flex: 1,
  },
  containerHor: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    flex: 0.4,
  },
  signinContainer: {
    marginTop: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    width: "100%",
    alignSelf: "center",
    fontFamily: "Petrona_700Bold",
    backgroundColor: "#3C3C434A",
    opacity: 0.3,
  },
  h2: {
    color: "#4C4C4C",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "Petrona_700Bold",

    alignSelf: "center",
    justifyContent: "center",
    display: "flex",
  },
  title: {
    fontSize: 50,
    letterSpacing: 3,
    fontFamily: "JacquesFrancoisShadow_400Regular",
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
    fontFamily: "Petrona_700Bold",
  },

  buttonAuth: {
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 8,
    alignItems: "center",
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
    fontFamily: "Petrona_700Bold",
  },
  buttonAuthText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Petrona_700Bold",
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
    backgroundColor: "#000", // change color if needed
  },
  lineText: {
    marginHorizontal: 10,
    fontSize: 20,
    color: "#333",
    fontFamily: "Petrona_700Bold",
  },
  buttonCreate: {
    textAlign: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonCreateText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Petrona_700Bold",
  },
  buttonInfo: {

  },
  buttonInfoText: {
    textAlign: "center",
    fontFamily: "Petrona_700Bold",
  },
  text: {
    fontFamily: "Petrona_700Bold",
    fontSize: 17,
  },
});
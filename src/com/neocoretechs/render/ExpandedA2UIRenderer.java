package com.neocoretechs.render;

import javafx.application.Application;
import javafx.beans.property.*;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import javafx.scene.text.Font;
import javafx.stage.Stage;
import org.json.JSONArray;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.*;
/**
 * Supports components: Card, Column, Row, Text, TextField, Slider, Image, Button.
 * Data binding for TextField and Slider updates the nested data model.
 * Button triggers an event handler (submitForm) that shows current data.
 * Image loads from URL bound in data.
 * Layout respects justify and align in Row.
 * Text variants adjust font size.
 * Data model is a nested Map converted from JSON.
 */
public class ExpandedA2UIRenderer extends Application {

    // Store components by ID
    private Map<String, JSONObject> componentsMap = new HashMap<>();
    // Data model as nested map
    private Map<String, Object> dataModel = new HashMap<>();
    // Store UI controls by data path for binding updates
    private Map<String, Property<?>> boundProperties = new HashMap<>();

    @Override
    public void start(Stage primaryStage) {
        // Example widget JSON with more components and features
        String widgetJsonStr = """
        {
          "components": [
            { "id": "root", "component": "Card", "child": "main-column" },
            { "id": "main-column", "component": "Column", "children": ["header", "input-row", "slider-row", "image-row", "button-row"] },
            { "id": "header", "component": "Text", "text": "Welcome to Expanded A2UI Renderer", "variant": "h2" },
            { "id": "input-row", "component": "Row", "children": ["label-name", "input-name"], "justify": "spaceBetween", "align": "center" },
            { "id": "label-name", "component": "Text", "text": "Name:", "variant": "body" },
            { "id": "input-name", "component": "TextField", "label": "Name", "value": { "path": "/user/name" }, "variant": "shortText" },
            { "id": "slider-row", "component": "Row", "children": ["label-age", "slider-age"], "justify": "spaceBetween", "align": "center" },
            { "id": "label-age", "component": "Text", "text": "Age:", "variant": "body" },
            { "id": "slider-age", "component": "Slider", "value": { "path": "/user/age" }, "min": 0, "max": 100, "label": "Age" },
            { "id": "image-row", "component": "Row", "children": ["profile-image"], "justify": "center" },
            { "id": "profile-image", "component": "Image", "url": { "path": "/user/profilePic" }, "fit": "cover", "variant": "mediumFeature" },
            { "id": "button-row", "component": "Row", "children": ["submit-button"], "justify": "center" },
            { "id": "submit-button-text", "component": "Text", "text": "Submit" },
            { "id": "submit-button", "component": "Button", "child": "submit-button-text", "action": { "event": { "name": "submitForm" } } }
          ],
          "data": {
            "user": {
              "name": "Alice",
              "age": 30,
              "profilePic": "https://www.example.com/profile.jpg"
            }
          }
        }
        """;

        JSONObject widgetJson = new JSONObject(widgetJsonStr);
        JSONArray components = widgetJson.getJSONArray("components");
        JSONObject data = widgetJson.getJSONObject("data");

        // Index components
        for (int i = 0; i < components.length(); i++) {
            JSONObject comp = components.getJSONObject(i);
            componentsMap.put(comp.getString("id"), comp);
        }

        // Load data model
        dataModel = jsonObjectToMap(data);

        // Render root component
        Node rootNode = renderComponent("root");

        Scene scene = new Scene((Region) rootNode, 600, 400);
        primaryStage.setScene(scene);
        primaryStage.setTitle("Expanded A2UI Renderer");
        primaryStage.show();
    }

    // Recursive render method
    private Node renderComponent(String id) {
        JSONObject comp = componentsMap.get(id);
        if (comp == null) {
            return new Label("Component not found: " + id);
        }

        String type = comp.getString("component");
        switch (type) {
            case "Card":
                return renderCard(comp);
            case "Column":
                return renderColumn(comp);
            case "Row":
                return renderRow(comp);
            case "Text":
                return renderText(comp);
            case "TextField":
                return renderTextField(comp);
            case "Slider":
                return renderSlider(comp);
            case "Image":
                return renderImage(comp);
            case "Button":
                return renderButton(comp);
            default:
                return new Label("Unsupported component: " + type);
        }
    }

    private Node renderCard(JSONObject comp) {
        String childId = comp.getString("child");
        Node childNode = renderComponent(childId);

        VBox card = new VBox(childNode);
        card.setPadding(new Insets(15));
        card.setStyle("-fx-border-color: gray; -fx-border-radius: 5; -fx-background-radius: 5; -fx-background-color: white; -fx-effect: dropshadow(gaussian, rgba(0,0,0,0.1), 5, 0, 0, 1);");
        return card;
    }

    private Node renderColumn(JSONObject comp) {
        VBox column = new VBox();
        column.setSpacing(8);

        if (comp.has("children")) {
            JSONArray children = comp.getJSONArray("children");
            for (int i = 0; i < children.length(); i++) {
                String childId = children.getString(i);
                Node childNode = renderComponent(childId);
                column.getChildren().add(childNode);
            }
        }

        column.setAlignment(Pos.TOP_LEFT);
        return column;
    }

    private Node renderRow(JSONObject comp) {
        HBox row = new HBox();
        row.setSpacing(10);

        if (comp.has("children")) {
            JSONArray children = comp.getJSONArray("children");
            for (int i = 0; i < children.length(); i++) {
                String childId = children.getString(i);
                Node childNode = renderComponent(childId);
                row.getChildren().add(childNode);
            }
        }

        // Handle justify property
        if (comp.has("justify")) {
            String justify = comp.getString("justify");
            switch (justify) {
                case "spaceBetween":
                    row.setHgrow(row.getChildren().get(0), Priority.ALWAYS);
                    row.setHgrow(row.getChildren().get(1), Priority.ALWAYS);
                    row.setAlignment(Pos.CENTER_LEFT);
                    break;
                case "center":
                    row.setAlignment(Pos.CENTER);
                    break;
                default:
                    row.setAlignment(Pos.CENTER_LEFT);
            }
        } else {
            row.setAlignment(Pos.CENTER_LEFT);
        }

        // Handle align property (vertical alignment)
        if (comp.has("align")) {
            String align = comp.getString("align");
            switch (align) {
                case "start":
                    row.setAlignment(Pos.CENTER_LEFT);
                    break;
                case "center":
                    row.setAlignment(Pos.CENTER);
                    break;
                case "end":
                    row.setAlignment(Pos.CENTER_RIGHT);
                    break;
                default:
                    // keep existing
            }
        }

        return row;
    }

    private Node renderText(JSONObject comp) {
        String text = comp.optString("text", "");
        String variant = comp.optString("variant", "body");

        Label label = new Label(text);

        switch (variant) {
            case "h1":
                label.setFont(Font.font(24));
                break;
            case "h2":
                label.setFont(Font.font(20));
                break;
            case "h3":
                label.setFont(Font.font(18));
                break;
            case "body":
            default:
                label.setFont(Font.font(14));
                break;
        }

        return label;
    }

    private Node renderTextField(JSONObject comp) {
        String labelText = comp.optString("label", "");
        Object valuePathObj = comp.opt("value");

        VBox container = new VBox(4);
        Label label = new Label(labelText);
        TextField textField = new TextField();

        if (valuePathObj instanceof JSONObject) {
            String path = ((JSONObject) valuePathObj).optString("path", "");
            Object boundValue = getValueFromPath(path);
            if (boundValue != null) {
                textField.setText(boundValue.toString());
            }
            // Bind back changes to data model
            textField.textProperty().addListener((obs, oldVal, newVal) -> {
                setValueAtPath(path, newVal);
            });
        }

        container.getChildren().addAll(label, textField);
        return container;
    }

    private Node renderSlider(JSONObject comp) {
        Object valuePathObj = comp.opt("value");
        double min = comp.optDouble("min", 0);
        double max = comp.optDouble("max", 100);
        String labelText = comp.optString("label", "");

        VBox container = new VBox(4);
        Label label = new Label(labelText);
        Slider slider = new Slider(min, max, min);

        if (valuePathObj instanceof JSONObject) {
            String path = ((JSONObject) valuePathObj).optString("path", "");
            Object boundValue = getValueFromPath(path);
            if (boundValue instanceof Number) {
                slider.setValue(((Number) boundValue).doubleValue());
            }
            slider.valueProperty().addListener((obs, oldVal, newVal) -> {
                setValueAtPath(path, newVal.doubleValue());
            });
        }

        container.getChildren().addAll(label, slider);
        return container;
    }

    private Node renderImage(JSONObject comp) {
        Object urlObj = comp.opt("url");
        String url = null;
        if (urlObj instanceof JSONObject) {
            url = (String) getValueFromPath(((JSONObject) urlObj).optString("path", ""));
        } else if (urlObj instanceof String) {
            url = (String) urlObj;
        }

        ImageView imageView = new ImageView();
        if (url != null && !url.isEmpty()) {
            try {
                Image image = new Image(url, 150, 150, true, true);
                imageView.setImage(image);
            } catch (Exception e) {
                // ignore loading errors
            }
        }
        imageView.setPreserveRatio(true);
        imageView.setSmooth(true);

        return imageView;
    }

    private Node renderButton(JSONObject comp) {
        String childId = comp.optString("child", null);
        Node childNode = childId != null ? renderComponent(childId) : new Label("Button");

        Button button = new Button();
        if (childNode instanceof Label) {
            button.setText(((Label) childNode).getText());
        } else {
            button.setGraphic(childNode);
        }

        if (comp.has("action")) {
            JSONObject action = comp.getJSONObject("action");
            JSONObject event = action.optJSONObject("event");
            if (event != null) {
                String eventName = event.optString("name", "");
                button.setOnAction(e -> handleEvent(eventName));
            }
        }

        return button;
    }

    // Simple event handler
    private void handleEvent(String eventName) {
        switch (eventName) {
            case "submitForm":
                System.out.println("Form submitted with data:");
                System.out.println(dataModel);
                Alert alert = new Alert(Alert.AlertType.INFORMATION, "Form submitted!\n" + dataModel);
                alert.show();
                break;
            default:
                System.out.println("Unhandled event: " + eventName);
        }
    }

    // Helper: get nested value from data model by path like "/user/name"
    private Object getValueFromPath(String path) {
        if (path == null || path.isEmpty() || !path.startsWith("/")) return null;
        String[] parts = path.substring(1).split("/");
        Object current = dataModel;
        for (String part : parts) {
            if (!(current instanceof Map)) return null;
            current = ((Map<?, ?>) current).get(part);
            if (current == null) return null;
        }
        return current;
    }

    // Helper: set nested value in data model by path
    private void setValueAtPath(String path, Object value) {
        if (path == null || path.isEmpty() || !path.startsWith("/")) return;
        String[] parts = path.substring(1).split("/");
        Map<String, Object> current = dataModel;
        for (int i = 0; i < parts.length - 1; i++) {
            Object next = current.get(parts[i]);
            if (!(next instanceof Map)) {
                next = new HashMap<String, Object>();
                current.put(parts[i], next);
            }
            current = (Map<String, Object>) next;
        }
        current.put(parts[parts.length - 1], value);
    }

    // Convert JSONObject to Map recursively
    private Map<String, Object> jsonObjectToMap(JSONObject json) {
        Map<String, Object> map = new HashMap<>();
        for (String key : json.keySet()) {
            Object val = json.get(key);
            if (val instanceof JSONObject) {
                map.put(key, jsonObjectToMap((JSONObject) val));
            } else if (val instanceof JSONArray) {
                map.put(key, jsonArrayToList((JSONArray) val));
            } else {
                map.put(key, val);
            }
        }
        return map;
    }

    // Convert JSONArray to List recursively
    private List<Object> jsonArrayToList(JSONArray array) {
        List<Object> list = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            Object val = array.get(i);
            if (val instanceof JSONObject) {
                list.add(jsonObjectToMap((JSONObject) val));
            } else if (val instanceof JSONArray) {
                list.add(jsonArrayToList((JSONArray) val));
            } else {
                list.add(val);
            }
        }
        return list;
    }

    public static void main(String[] args) {
        launch(args);
    }
}


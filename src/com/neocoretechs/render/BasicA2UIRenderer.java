package com.neocoretechs.render;


import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.stage.Stage;

public class BasicA2UIRenderer extends Application {

    // Store components by ID for reference
    private Map<String, JSONObject> componentsMap = new HashMap<>();

    @Override
    public void start(Stage primaryStage) {
        // Example A2UI widget JSON (simplified)
        String widgetJsonStr = """
        {
          "components": [
            { "id": "root", "component": "Card", "child": "main-column" },
            { "id": "main-column", "component": "Column", "children": ["header", "body"] },
            { "id": "header", "component": "Text", "text": "Welcome to Basic A2UI Renderer", "variant": "h2" },
            { "id": "body", "component": "Row", "children": ["left-text", "right-text"], "justify": "spaceBetween" },
            { "id": "left-text", "component": "Text", "text": "Left side content", "variant": "body" },
            { "id": "right-text", "component": "Text", "text": "Right side content", "variant": "body" }
          ],
          "data": {}
        }
        """;

        JSONObject widgetJson = new JSONObject(widgetJsonStr);
        JSONArray components = widgetJson.getJSONArray("components");

        // Index components by ID
        for (int i = 0; i < components.length(); i++) {
            JSONObject comp = components.getJSONObject(i);
            componentsMap.put(comp.getString("id"), comp);
        }

        // Render root component
        Node rootNode = renderComponent("root");

        Scene scene = new Scene((Region) rootNode, 600, 200);
        primaryStage.setScene(scene);
        primaryStage.setTitle("Basic A2UI Renderer");
        primaryStage.show();
    }

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

        // Alignment and justification can be enhanced here if needed
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

        // Handle justify property (simplified)
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

    public static void main(String[] args) {
        launch(args);
    }
}

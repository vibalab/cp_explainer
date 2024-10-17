import React from "react";
import Accordion from "./sub/Accordion";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Tooltips: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const title = "Tooltips for CP-Explainer";

  const systemInfo = (
    <Accordion title="System Description">
      <p>
        This system is a web-based interactive visualization tool built to
        analyze <strong>core-periphery (CP) structures</strong> in networks.
        Utilizing technologies such as{" "}
        <a
          href="https://www.sigmajs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sigma.js
        </a>{" "}
        and React with TypeScript, the tool enables{" "}
        <strong>real-time interaction</strong> with network data, making it
        highly responsive for exploring complex networks. Various CP detection
        methods, such as probabilistic block models and proximity-based
        centrality measures, help users visually differentiate core nodes—those
        with dense connections—from peripheral nodes, enhancing the intuitive
        understanding of network structures.
        <br />
        <br />
        The system supports the use of <strong>GEXF format</strong> for external
        data uploads, ensuring compatibility with widely used tools like{" "}
        <a href="https://gephi.org" target="_blank" rel="noopener noreferrer">
          Gephi
        </a>
        . This flexibility allows users to switch between traditional tools and
        the interactive system for <strong>CP analysis</strong>. Designed for
        accessibility, the tool's intuitive interface supports users from
        various backgrounds, enabling them to quickly gain insights through{" "}
        <strong>real-time, interactive visualization</strong>.
      </p>
    </Accordion>
  );

  const dataload = (
    <Accordion title="Network Data Uploading">
      <center>
        <img
          src="/data_upload.png" // Replace with the actual path to your image in public folder
          alt="Data Upload"
          style={{ width: "300px", height: "auto", marginBottom: "20px" }} // Adjust style as needed
        />
      </center>
      <p>
        <strong>Upload Data Button</strong>: This button opens a modal window
        for uploading GEXF files.
      </p>
      <br />
      <p>
        <strong>File Upload Modal</strong>: Users can select a GEXF file from
        their system. In the example, the file <em>airlines-sample.gexf</em> is
        selected. After selecting, clicking the <strong>Load</strong> button
        uploads and processes the data, which is then visualized in the network
        graph. Users can also quit without changes by clicking the{" "}
        <strong>Quit</strong> button.
      </p>
    </Accordion>
  );

  const graphViz = (
    <Accordion title="Graph Visualization">
      <center>
        <img
          src="/graph_viz.png" // Replace with the actual path to your image in public folder
          alt="Data Upload"
          style={{ width: "80%", height: "auto", marginBottom: "20px" }} // Adjust style as needed
        />
        <p>{"< Loaded Graph >"}</p>
      </center>
      <br />
      <p>
        Data is automatically visualized as a network uploaded. Powered by{" "}
        <strong>Sigma.js</strong>, it allows users to interactively explore
        nodes and edges that represent relationships between entities in a
        network. The main features of this system include node degree
        visualization, edge strength indication, and real-time interactions.
      </p>

      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Node Size Based on Degree</strong>: The size of each node in
          the graph represents its degree, which indicates the number of
          connections that node has. Larger nodes have more connections and are
          generally more central within the network, signifying their importance
          or influence within the core-periphery structure.
        </li>
        <li>
          <strong>Edge Thickness for Connection Strength</strong>: The thickness
          of the edges reflects the strength of the connection between nodes.
          Stronger or more significant connections are visualized with thicker
          lines, allowing users to easily distinguish between different levels
          of connectivity.
        </li>
        <li>
          <strong>Real-Time Interaction</strong>: Users can interact with the
          graph through a variety of intuitive actions:
          <ul style={{ listStyleType: "circle", paddingLeft: "20px" }}>
            <li>
              <strong>Hover</strong>: Highlight a node and its immediate
              connections by hovering over it. This interaction allows users to
              quickly identify which nodes are connected.
            </li>
            <li>
              <strong>Click</strong>: Clicking on a node provides detailed
              information, including its label and specific metrics, while also
              highlighting its neighboring nodes.
            </li>
            <li>
              <strong>Drag and Drop</strong>: Users can freely move nodes around
              the canvas to explore the network layout in a way that best suits
              their analysis.
            </li>
          </ul>
        </li>
        <li>
          <strong>Graph Tools and Controls</strong>: At the bottom of the
          screen, several interactive tools enhance the visualization
          experience:
          <ul style={{ listStyleType: "circle", paddingLeft: "20px" }}>
            <li>
              <strong>Zoom In/Out</strong>: Users can zoom into specific areas
              of the graph or zoom out for a broader view of the entire network.
            </li>
            <li>
              <strong>Full-Screen Mode</strong>: The graph can be expanded to
              fill the entire screen, providing a more immersive analysis
              experience.
            </li>
            <li>
              <strong>Screenshot</strong>: A screenshot tool allows users to
              capture the current state of the graph for documentation or
              further analysis.
            </li>
          </ul>
        </li>
        <li>
          <strong>Search Functionality</strong>: Located at the bottom-right
          corner of the interface, a search tool (magnifying glass icon) allows
          users to quickly find and highlight specific nodes in the network by
          name or other identifiers. This feature makes it easy to locate
          particular nodes within large and complex graphs.
        </li>
      </ul>
    </Accordion>
  );

  const methodSelection = (
    <Accordion title="Method Selection">
      <center>
        <img
          src="/method_selection.png" // Replace with the actual path to your image in public folder
          alt="Data Upload"
          style={{ width: "80%", height: "auto", marginBottom: "20px" }} // Adjust style as needed
        />
        <p>{"< Method Selection >"}</p>
      </center>
      <br />
      <p>
        The <strong>Method Selection</strong> feature allows users to choose
        from different algorithms to detect and analyze the core-periphery
        structure in a network. Follow these steps to select and apply a method:
      </p>

      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Open the Method Selection Modal</strong>: Click on the{" "}
          <strong>"Change Method"</strong> button located at the top of the
          interface. This will open a modal window where you can choose from a
          list of available methods.
        </li>
        <li>
          <strong>Choose a Method</strong>: In the dropdown menu labeled{" "}
          <strong>"Choose a method"</strong>, select your desired method. For
          example, you might choose the <strong>Borgatti Everett</strong>{" "}
          method, as displayed in the image.
        </li>
        <li>
          <strong>Set Parameters (Optional)</strong>: Some methods, like the
          Borgatti Everett method, require additional parameters. You can input
          these values in the respective fields if needed. If not applicable or
          unsure, the default values can often be used.
        </li>
        <li>
          <strong>Confirm Your Selection</strong>: After selecting the method
          and entering any necessary parameters, click the{" "}
          <strong>Confirm</strong> button to apply the chosen method to your
          network. If you change your mind, click <strong>Cancel</strong> to
          close the modal without applying changes.
        </li>
        <li>
          <strong>Visualize the Results</strong>: Once the method is applied,
          the network will update automatically to reflect the new
          core-periphery structure. The network visualization will highlight
          core nodes and edges according to the selected method’s algorithm.
        </li>
        <li>
          <strong>Metric Display</strong>: After applying a method, a{" "}
          <strong>Metric Box</strong> will appear in the bottom-left corner of
          the screen. This box displays the selected method (e.g.,{" "}
          <strong>Borgatti Everett</strong>) along with the calculated{" "}
          <strong>ρ</strong> value (core-periphery fitness score). You can{" "}
          <strong>Refresh the Metric</strong> if needed, to recalculate the
          metric based on any new adjustments to the network or parameters.
        </li>
        <li>
          <strong>Continue Analysis</strong>: Users can experiment with
          different methods to compare how various algorithms define the core
          and periphery. Switch between methods or adjust parameters as needed
          to explore different perspectives of the network’s structure.
        </li>
      </ul>

      <p>
        <strong>Key Points:</strong>
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Method Selection</strong> allows users to apply different
          core-periphery detection algorithms to the network.
        </li>
        <li>
          Some methods may require additional parameters (like number of
          iterations values).
        </li>
        <li>
          Once confirmed, the system automatically updates the network and
          displays the corresponding core-periphery metrics.
        </li>
      </ul>
    </Accordion>
  );

  const detailPanel = (
    <Accordion title="Detail Panel">
      <center>
        <img
          src="/detail_panel.png" // Replace with the actual path to your image in public folder
          alt="Data Upload"
          style={{ width: "90%", height: "auto", marginBottom: "20px" }} // Adjust style as needed
        />
        <p>
          {"< "}
          The image displays various detail panels from the top-left, arranged
          as follows: Graph Statistics Panel(top-left), Node Details Panel
          (top-middle), Connected Nodes Panel(top-right), Connection Probability
          Table (bottom-left), Adjacency Matrix Heatmap Panel (bottom-middle),
          Closeness Centrality Boxplot Panel (bottom-right).
          {" >"}
        </p>
      </center>
      <br />
      <h3>1. Graph Statistics Panel</h3>
      <p>
        This panel provides an overview of key graph statistics. It includes
        metrics such as:
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Node Count</strong>: The total number of nodes in the graph.
        </li>
        <li>
          <strong>Edge Count</strong>: The total number of edges connecting
          nodes.
        </li>
        <li>
          <strong>Average Degree</strong>: The average number of edges per node.
        </li>
        <li>
          <strong>Density</strong>: The proportion of possible edges that are
          actually present in the network.
        </li>
        <li>
          <strong>Clustering Coefficient</strong>: Measures the tendency of
          nodes to form tightly connected clusters.
        </li>
        <li>
          <strong>Shortest Path Length</strong>: The average shortest distance
          between two nodes.
        </li>
        <li>
          <strong>Centrality Metrics</strong>: Including Degree Centrality,
          Betweenness Centrality, Closeness Centrality, and Eigenvector
          Centrality.
        </li>
      </ul>
      <br />
      <h3>2. Node Details Panel</h3>
      <p>
        This panel focuses on a selected node (e.g.,{" "}
        <strong>Memphis International</strong>) and provides detailed
        information, such as:
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Degree</strong>: The number of edges connected to the node.
        </li>
        <li>
          <strong>Degree Centrality</strong>: A measure of the node’s direct
          connections.
        </li>
        <li>
          <strong>Betweenness Centrality</strong>: Indicates the node’s role as
          a bridge in the network.
        </li>
        <li>
          <strong>Closeness Centrality</strong>: Measures how quickly a node can
          reach other nodes.
        </li>
        <li>
          <strong>Eigenvector Centrality</strong>: Reflects the importance of
          the node's neighbors.
        </li>
      </ul>
      <p>
        Additionally, it lists <strong>Connected Nodes</strong>, distinguishing
        between core and peripheral nodes, helping users explore the node’s
        network positioning.
      </p>

      <br />
      <h3>3. Connected Nodes Panel</h3>
      <p>
        This panel shows the list of nodes connected to a selected core node
        (e.g., <strong>Memphis International</strong>), dividing them into:
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Core Nodes</strong>: Nodes classified as part of the core
          network.
        </li>
        <li>
          <strong>Periphery Nodes</strong>: Nodes classified as part of the
          periphery.
        </li>
      </ul>
      <p>
        The panel provides insight into how the selected node interacts with
        both core and periphery groups.
      </p>
      <br />

      <h3>4. Connection Probability Table</h3>
      <p>
        This table provides a breakdown of connection probabilities between
        different types of nodes (core vs. periphery):
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          <strong>Core-Core, Core-Periphery, Periphery-Periphery</strong>: The
          table displays the probability of connection between these node types.
        </li>
        <li>
          <strong>(Actual) / (Possible)</strong>: Shows the actual number of
          connections versus the possible number of connections for each type of
          relationship.
        </li>
        <li>
          <strong>Total Connection Probability (p)</strong>: The overall
          probability of a connection in the network, with an interpretation of
          the structure.
        </li>
      </ul>

      <br />

      <h3>5. Adjacency Matrix Heatmap Panel</h3>
      <p>
        This panel provides a <strong>heatmap</strong> representation of the
        adjacency matrix:
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          The heatmap highlights the core-periphery boundary by distinguishing
          core-core, core-periphery, and periphery-periphery connections.
        </li>
        <li>
          <strong>Core-Core</strong> connections are displayed in the top-left,
          while <strong>Periphery-Periphery</strong> connections are in the
          bottom-right.
        </li>
        <li>
          A <strong>Refresh Heatmap</strong> button allows users to update the
          matrix based on any changes in the network.
        </li>
      </ul>

      <br />
      <h3>6. Closeness Centrality Boxplot Panel</h3>
      <p>
        This panel provides a <strong>boxplot</strong> comparing{" "}
        <strong>Closeness Centrality</strong> between core and periphery nodes:
      </p>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          Core nodes tend to have higher closeness centrality, meaning they are
          more easily reachable.
        </li>
        <li>Periphery nodes typically have lower closeness centrality.</li>
        <li>
          The dashed line represents the overall average closeness centrality
          across the network.
        </li>
        <li>
          A <strong>Refresh Boxplot</strong> button updates the boxplot based on
          any changes.
        </li>
      </ul>
    </Accordion>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-content">
          {systemInfo} {dataload} {graphViz} {methodSelection} {detailPanel}
        </div>
      </div>
    </div>
  );
};

export default Tooltips;

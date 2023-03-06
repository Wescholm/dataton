# %% Import dependencies
import json
import argparse
import numpy as np
import geopandas as gpd

parser = argparse.ArgumentParser(description="Generate coordinates for a given country")
parser.add_argument(
    "--country", type=str, required=True, help="The country to generate coordinates for"
)
parser.add_argument(
    "--spacing", type=float, default=0.05, help="The spacing between coordinates"
)
parser.add_argument(
    "--output", type=str, default="./coordinates.json", help="Output file path"
)
args = parser.parse_args()

country = args.country  # 3-letter country code
spacing_distance = args.spacing  # 0.01 = 1 km
output_path = args.output  # Output file path

# %% Create a GeoDataFrame with a polygon of the country
country_df = gpd.read_file(gpd.datasets.get_path("naturalearth_lowres"))
country_df = country_df[country_df.iso_a3 == country]
# %% Define the bounding box of the continental country
xmin, ymin, xmax, ymax = country_df.total_bounds

# %% Create a grid of points with 1 km spacing
x_coords = np.arange(xmin, xmax, spacing_distance)
y_coords = np.arange(ymin, ymax, spacing_distance)
xx, yy = np.meshgrid(x_coords, y_coords)
points = gpd.GeoDataFrame(geometry=gpd.points_from_xy(xx.ravel(), yy.ravel()))

# %% Filter out points that are not within the country polygon
points = gpd.sjoin(points, country_df, op="within")


# %% Save the coordinates to a JSON file
def convert_to_text(row):
    return f"[{row.geometry.y}, {row.geometry.x}]"


points["json"] = points.apply(convert_to_text, axis=1)
array = points["json"].values

with open(output_path, "w") as f:
    f.write(json.dumps(array.tolist()))

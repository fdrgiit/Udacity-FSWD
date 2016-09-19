import webbrowser
import os
import re
import csv

def read_template(template):
    return ''.join([row for row in open('templates/_{}.html'.format(template),'r').readlines()]) #returns html string from `templates/_<template>.html`

main_page_head = read_template('head') # styles and scripting for the page

main_page_content = read_template('content') # the main page layout and title bar

movie_tile_content = read_template('movie') # a single movie entry html template

def create_movie_tiles_content(movies): # Generating HTML content for this section of the page
    content = ''
    for movie in movies:
        youtube_id_match = re.search(r'(?<=v=)[^&#]+', movie.trailer_youtube_url)
        youtube_id_match = youtube_id_match or re.search(r'(?<=be/)[^&#]+', movie.trailer_youtube_url)
        trailer_youtube_id = youtube_id_match.group(0) if youtube_id_match else None

        content += movie_tile_content.format(
            movie_title=movie.title,
            poster_image_url=movie.poster_image_url,
            trailer_youtube_id=trailer_youtube_id,
            year=movie.year
        )
    return content

def open_movies_page(movies, filename='movie_trailers.html'): # Create or overwrite the output file
    output_file = open(filename, 'w')

    rendered_content = main_page_content.format(movie_tiles=create_movie_tiles_content(movies))

    output_file.write(main_page_head + rendered_content) # Output the file
    output_file.close()

    url = os.path.abspath(output_file.name)
    webbrowser.open('file://' + url, new=2) # open the output file in the browser

class Movie(object):
    
    def __init__(self, title, image_url, youtube_url, year):
        self.title = title
        self.poster_image_url = image_url
        self.trailer_youtube_url = youtube_url
        self.year = year

    def __str__(self):
        return self.title

def get_movies(filename):
    movies = []
    with open(filename, 'rb') as csvfile:
        reader = csv.DictReader(csvfile)
        for movie in reader:
            movies.append(Movie(title=movie['name'],
                                image_url=movie['image_url'],
                                youtube_url=movie['youtube_url'],
                                year=movie['year']))
    return movies

def main():
    movies = get_movies('data/Database.csv')
    open_movies_page(movies, 'movie_trailers.html')

if __name__ == '__main__':
    main()